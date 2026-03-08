import os
import shutil
import uuid
import numpy as np
import cv2
import requests
import time
from fastapi import FastAPI, File, UploadFile, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse, JSONResponse

from dotenv import load_dotenv
load_dotenv()


# ---------------------------
# App Initialization
# ---------------------------
app = FastAPI(title="Franklin AI Service (Production)")
# ---------------------------
# App Initialization
# ---------------------------
app = FastAPI(title="Franklin AI Service (Production)")

# ---------------------------
# CORS
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://franklin-frontend.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Configuration
# ---------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models_data")
OUTPUT_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Render environment variables
NODE_BACKEND_URL = (os.environ.get("NODE_BACKEND_URL") or "").strip().rstrip("/")
AI_SERVICE_URL = (os.environ.get("AI_SERVICE_URL") or "").strip().rstrip("/")

# If running on Render, ensure config dir is writeable
os.environ.setdefault("YOLO_CONFIG_DIR", "/tmp/Ultralytics")

# Model Weight URLs (Set in Render env)
WEIGHT_URLS = {
    "unified_turtle": os.environ.get("UNIFIED_TURTLE_URL"),
    "unified_predator": os.environ.get("UNIFIED_PREDATOR_URL"),
    "shoreline": os.environ.get("SHORELINE_URL"),
    "hatchery": os.environ.get("HATCHERY_URL"),
}

MODEL_PATHS = {
    "unified_turtle": os.path.join(MODELS_DIR, "unified_turtle.pt"),
    "unified_predator": os.path.join(MODELS_DIR, "unified_predator.pt"),
    "shoreline": os.path.join(MODELS_DIR, "shoreline_seg.pt"),
    "hatchery": os.path.join(MODELS_DIR, "hatchery_best.pt"),
}

# ---------------------------
# Lazy Singletons
# Lazy Singletons
# ---------------------------
unified_processor = None
shoreline_model = None
hatchery_engine = None
disease_classifier = None


@app.on_event("startup")
async def startup_event():
    print("Franklin AI Service starting... Pre-loading models if available.")
    # Attempt pre-loading (it's okay if they fail here, they'll retry lazily or report 503)
    try:
        get_unified()
        print("✅ Unified models pre-loaded")
    except Exception: pass

    try:
        get_shoreline()
        print("✅ Shoreline model pre-loaded")
    except Exception: pass

    try:
        get_hatchery()
        print("✅ Hatchery model pre-loaded")
    except Exception: pass

    try:
        get_disease()
        print("✅ Disease model pre-loaded")
    except Exception: pass

    # Register default tanks from test videos if they exist
    try:
        hatchery = get_hatchery()
        # Use absolute search path for test videos
        base_path = r"C:\Users\USER\Desktop\Research\Franklin"
        test_vid_dir = os.path.join(base_path, "Models", "AI_Service", "test_videos")
        
        print(f"📂 Checking test videos in: {test_vid_dir}")
        for tank_id in ["tankA", "tankB", "tankC", "tankD"]:
            vid_path = os.path.join(test_vid_dir, f"{tank_id}.mov")
            if os.path.exists(vid_path):
                # Verify cv2 can open it
                test_cap = cv2.VideoCapture(vid_path)
                if test_cap.isOpened():
                    hatchery.register_video(tank_id, vid_path)
                    print(f"✅ Registered tank: {tank_id} with path {vid_path}")
                    test_cap.release()
                else:
                    print(f"❌ OpenCV failed to open: {vid_path}")
            else:
                print(f"⚠️ Missing test video: {vid_path}")
    except Exception as e:
         print(f"❌ Default tanks registration failed: {e}")


# ---------------------------
# Lazy Loaders
# Lazy Loaders
# ---------------------------
def get_unified():
    global unified_processor
    if unified_processor is None:
        ensure_weight_exists("unified_turtle")
        ensure_weight_exists("unified_predator")
        
        # Check files again
        if not (os.path.exists(MODEL_PATHS["unified_turtle"]) and os.path.exists(MODEL_PATHS["unified_predator"])):
            raise HTTPException(503, "Unified model weights missing. Check /health for details.")
            
        try:
            from models.unified import UnifiedProcessor
            unified_processor = UnifiedProcessor(MODELS_DIR, NODE_BACKEND_URL)
            print("✅ UnifiedProcessor initialized")
            print("✅ UnifiedProcessor initialized")
        except Exception as e:
            raise HTTPException(503, f"Failed to Load Unified Processor: {e}")
            raise HTTPException(503, f"Failed to Load Unified Processor: {e}")
    return unified_processor

def get_shoreline():
    global shoreline_model
    if shoreline_model is None:
        ensure_weight_exists("shoreline")
        ensure_weight_exists("shoreline")
        if not os.path.exists(MODEL_PATHS["shoreline"]):
            raise HTTPException(503, "Shoreline weights missing.")
            
            raise HTTPException(503, "Shoreline weights missing.")
            
        try:
            from models.shoreline import ShorelineModel, ShorelineSettings
            settings = ShorelineSettings(model_path=MODEL_PATHS["shoreline"])
            shoreline_model = ShorelineModel(settings)
            print("✅ ShorelineModel initialized")
            print("✅ ShorelineModel initialized")
        except Exception as e:
            raise HTTPException(503, f"Failed to load Shoreline model: {e}")
            raise HTTPException(503, f"Failed to load Shoreline model: {e}")
    return shoreline_model

def get_hatchery():
    global hatchery_engine
    if hatchery_engine is None:
        ensure_weight_exists("hatchery")
        ensure_weight_exists("hatchery")
        if not os.path.exists(MODEL_PATHS["hatchery"]):
            raise HTTPException(503, "Hatchery weights missing.")
            
            raise HTTPException(503, "Hatchery weights missing.")
            
        try:
            from models.hatchery import HatcheryEngine
            hatchery_engine = HatcheryEngine(MODEL_PATHS["hatchery"], NODE_BACKEND_URL)
            print("✅ HatcheryEngine initialized")
            print("✅ HatcheryEngine initialized")
        except Exception as e:
            raise HTTPException(503, f"Failed to load Hatchery engine: {e}")
            raise HTTPException(503, f"Failed to load Hatchery engine: {e}")
    return hatchery_engine


def get_disease():
    global disease_classifier
    if disease_classifier is None:
        try:
            import sys
            disease_dir = os.path.abspath(os.path.join(BASE_DIR, "..", "Disease_Detection"))
            if disease_dir not in sys.path:
                sys.path.append(disease_dir)
            from inference import DiseaseClassifier
            model_path = os.path.join(disease_dir, "protonet_conv4_encoder.keras")
            support_dir = os.path.join(disease_dir, "support_set")
            disease_classifier = DiseaseClassifier(model_path, support_dir)
            print("✅ DiseaseClassifier loaded lazily")
        except Exception as e:
            print(f"❌ Disease init failed: {e}")
            raise HTTPException(503, f"Disease model load failed: {e}")
    return disease_classifier


def get_disease_disabled():
    # Tensorflow/Keras removed for deploy success on Render free tier
    return {
        "status": "ok",
        "env": {
            "node_backend": NODE_BACKEND_URL,
            "ai_service_url": AI_SERVICE_URL,
            "detected_base": str(request.base_url).rstrip("/")
        },
        "models": {
            "unified": unified_processor is not None,
            "shoreline": shoreline_model is not None,
            "hatchery": hatchery_engine is not None,
        },
        "weights": {k: os.path.exists(v) for k, v in MODEL_PATHS.items()}
    }


@app.get("/")
def root():
    return {
        "service": "Franklin AI Service", 
        "status": "online",
        "endpoints": ["/health", "/ai/unified/analyze", "/ai/shoreline/predict", "/ai/hatchery/register_upload"]
    }

@app.get("/health")
def health(request: Request):
    return {
        "status": "ok",
        "env": {
            "node_backend": NODE_BACKEND_URL,
            "ai_service_url": AI_SERVICE_URL,
            "detected_base": str(request.base_url).rstrip("/")
        },
        "models": {
            "unified": unified_processor is not None,
            "shoreline": shoreline_model is not None,
            "hatchery": hatchery_engine is not None,
            "disease": disease_classifier is not None,
        },
        "weights": {k: os.path.exists(v) for k, v in MODEL_PATHS.items()}
    }

@app.post("/ai/unified/analyze")
async def analyze_unified(request: Request, file: UploadFile = File(...)):
    processor = get_unified()
    
async def analyze_unified(request: Request, file: UploadFile = File(...)):
    processor = get_unified()
    
    vid_id = uuid.uuid4().hex
    filename = f"{vid_id}.mp4"
    path = os.path.join(OUTPUT_DIR, filename)

    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)

    try:
        result = processor.process_video(path, filename)
        
        # Determine current base URL dynamically if env is missing
        base = AI_SERVICE_URL or str(request.base_url).rstrip("/")
        result["video_url"] = f"{base}/content/{filename}"
        return result
    except Exception as e:
        raise HTTPException(500, str(e))


# ---------------------------
# DISEASE ENDPOINTS
# ---------------------------
@app.post("/ai/disease/classify")
async def classify_disease(file: UploadFile = File(...)):
    try:
        classifier = get_disease()
        content = await file.read()
        result = classifier.classify(content)
        if "error" in result:
             raise HTTPException(500, result["error"])
        return result
    except HTTPException:
        raise
    except Exception as e:
        print(f"Fallback due to error: {e}")
        return get_disease_disabled()


# ---------------------------
# SHORELINE ENDPOINTS
# ---------------------------
def shoreline_compute_risk(points: list, img_h: int) -> tuple:
    if not points:
        return "medium", ["No shoreline detected."]
    ys = [p["y"] for p in points]
    avg_y = float(np.mean(ys))
    if avg_y < img_h * 0.35:
        return "high", ["Shoreline inland (high runup)."]
    if avg_y < img_h * 0.55:
        return "medium", ["Moderate shoreline position."]
    return "low", ["Shoreline near sea (low runup)."]


@app.post("/ai/shoreline/predict")
async def predict_shoreline(file: UploadFile = File(...)):
    shore = get_shoreline()
    content = await file.read()
    nparr = np.frombuffer(content, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    
    if img is None:
        raise HTTPException(400, "Could not decode image.")
        raise HTTPException(400, "Could not decode image.")

    pts, conf, mask_b64 = shore.predict(img)
    
    
    h = img.shape[0]
    risk_level = "low"
    if pts:
        ys = [p.get("y") for p in pts if isinstance(p, dict) and "y" in p]
        ys = [y for y in ys if y is not None]
        if ys:
            avg = float(np.mean(ys))
            if avg < h * 0.35: risk_level = "high"
            elif avg < h * 0.55: risk_level = "medium"
            if avg < h * 0.35: risk_level = "high"
            elif avg < h * 0.55: risk_level = "medium"

    return {
        "shoreline_points": pts,
        "shoreline_conf": conf,
        "risk_level": risk_level,
        "notes": ["Shoreline detected."],
        "mask_png_b64": mask_b64,
        "image": {"w": img.shape[1], "h": img.shape[0]},
    }

@app.post("/ai/hatchery/register_upload")
async def register_hatchery(request: Request):
    hatchery = get_hatchery()
    data = await request.json()
    vid_id, vid_path = data.get("videoId"), data.get("videoPath")
    
    vid_id, vid_path = data.get("videoId"), data.get("videoPath")
    
    if not vid_id or not vid_path:
        raise HTTPException(400, "videoId and videoPath are required.")
        raise HTTPException(400, "videoId and videoPath are required.")

    if hatchery.register_video(vid_id, vid_path):
    if hatchery.register_video(vid_id, vid_path):
        return {"status": "registered", "videoId": vid_id}
    raise HTTPException(500, "Registration failed.")
    raise HTTPException(500, "Registration failed.")

@app.get("/ai/hatchery/stream/{video_id}")
def stream_hatchery(video_id: str):
    hatchery = get_hatchery()
    
    
    def iter_frames():
        path = hatchery.video_sources.get(video_id)
        if not path:
            print(f"❌ No video source for {video_id}")
            return

        print(f"📹 Starting stream for {video_id} from {path}")
        cap = cv2.VideoCapture(path)
        if not cap.isOpened():
             print(f"❌ Failed to open video file: {path}")
             return

        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                # Loop back to start or try to reopen if failed
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                success, frame = cap.read()
                if not success:
                    print(f"⚠️ Reopening video {video_id}...")
                    cap.release()
                    cap = cv2.VideoCapture(path)
                    continue

            frame = hatchery.process_frame(frame, video_id, fps)
            _, buf = cv2.imencode(".jpg", frame)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buf.tobytes() + b"\r\n")
            
        cap.release()
    return StreamingResponse(iter_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/ai/hatchery/data/{video_id}")
def data_hatchery(video_id: str):
    hatchery = get_hatchery()
    return hatchery.states.get(video_id, {"status": "Offline", "health": "Unknown"})

# ---------------------------
# Static content output
# ---------------------------
@app.get("/content/{filename}")
async def get_content(filename: str):
    path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(path):
        return FileResponse(path)
    raise HTTPException(404, "Content not found.")

@app.post("/ai/disease/classify")
async def classify_disease():
    return JSONResponse(
        status_code=503,
        content={"message": "Disease model is currently disabled in this lightweight deployment."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
    raise HTTPException(404, "Content not found.")

@app.post("/ai/disease/classify")
async def classify_disease():
    return JSONResponse(
        status_code=503,
        content={"message": "Disease model is currently disabled in this lightweight deployment."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
