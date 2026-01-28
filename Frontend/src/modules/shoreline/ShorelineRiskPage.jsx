import React, { useEffect, useRef, useState } from "react";
import {
  MapPin,
  AlertTriangle,
  Upload,
  Video,
  Activity,
  Shield,
  ShieldAlert,
  Zap,
  CloudRain,
  Waves,
} from "lucide-react";

import ShorelineBeachMap from "../../shared/components/maps/ShorelineBeachMap.jsx";
import ShorelineVideoPlayer from "../shoreline/ShorelineVideoPlayer.jsx";
import ShorelineAlertsPanel from "../shoreline/ShorelineAlertsPanel.jsx";
import EnvironmentManualForm from "../shoreline/EnvironmentManualForm.jsx";

import {
  getBoundary,
  getNests,
  getAlerts,
  evaluateOffline,
  // predictVideo,          // ❌ optional (keep only if you still want upload video)
  predictDemoVideo, // ✅ NEW: auto-load demo predictions
} from "./api/shorelineApi.js";

const DEMO_VIDEO_SRC = "/videos/shoreline_demo.mp4";
const DEMO_VIDEO_NAME = "shoreline_demo.mp4";

function nestStatusFromDistance(d) {
  if (d == null) return "safe";
  if (d <= 5) return "danger";
  if (d <= 8) return "warning";
  return "safe";
}

function pxToPct(pointsPx, imgW, imgH) {
  return (pointsPx || []).map((p) => ({
    x: Math.max(0, Math.min(100, (Number(p.x) / imgW) * 100)),
    y: Math.max(0, Math.min(100, (Number(p.y) / imgH) * 100)),
    conf: p.conf ?? null,
  }));
}

function StatCard({
  label,
  value,
  sub,
  accent,
  softBg,
  borderColor,
  icon: Icon,
  pulse,
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 shadow-sm transition-all hover:shadow-md"
      style={{
        backgroundColor: softBg,
        border: `1px solid ${borderColor}`,
      }}
    >
      <div
        className="absolute left-0 top-0 h-1 w-full"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-start justify-between">
        <div
          className="flex h-11 w-11 items-center justify-center rounded-xl"
          style={{
            backgroundColor: "#ffffffcc",
            color: accent,
          }}
        >
          <Icon size={18} />
        </div>

        {pulse && <LiveDot color={accent} />}
      </div>

      <div className="mt-4">
        <p
          className="text-3xl font-bold tracking-tight"
          style={{ color: accent }}
        >
          {value}
        </p>

        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
          {label}
        </p>

        {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
      </div>
    </div>
  );
}

export default function ShorelineRiskPage() {
  const [boundary, setBoundary] = useState([]);
  const [shoreline, setShoreline] = useState([]);
  const [nests, setNests] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [crossedBoundary, setCrossedBoundary] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [frameSeriesPct, setFrameSeriesPct] = useState([]);
  const [currentEnvironment, setCurrentEnvironment] = useState(null);

  const videoRef = useRef(null);
  const { getToken } = useAuth();

  const playVideoFromStart = () => {
    setTimeout(() => {
      const v = videoRef.current;
      if (!v) return;
      v.currentTime = 0;
      v.play().catch(() => {});
    }, 150);
  };

  const loadStatic = async () => {
    try {
      const [b, n, a] = await Promise.all([
        getBoundary(),
        getNests(),
        getAlerts(),
      ]);

      setBoundary(b?.points || []);
      setNests(
        (n || []).map((item) => ({
          id: item.id,
          x: item.x,
          y: item.y,
          zone: item.label,
          status: "safe",
        })),
      );
      setAlerts(a || []);
    } catch (e) {
      console.error("Static load failed:", e);
    }
  };

  useEffect(() => {
    loadStatic();
  }, []);

  useEffect(() => {
    setVideoUrl(DEMO_VIDEO_SRC);

    (async () => {
      try {
        setLoading(true);
        const data = await predictDemoVideo(DEMO_VIDEO_NAME);
        const fps = Number(data?.fps || 30);

        const isFrameIndex =
          Array.isArray(data?.frames) &&
          data.frames.length > 2 &&
          Number(data.frames[1]?.t) > 5;

        const series = (data?.frames || [])
          .map((f) => {
            const imgW = f.image?.w || 1920;
            const imgH = f.image?.h || 1080;
            const tSec = isFrameIndex
              ? Number(f.t || 0) / fps
              : Number(f.t || 0);

            return {
              t: tSec,
              shorelinePct: pxToPct(f.shoreline_points, imgW, imgH),
              evaluation: null,
              risk: f.risk_level || "medium",
            };
          })
          .filter((f) => (f.shorelinePct || []).length > 1);

        setFrameSeriesPct(series);
        if (series[0]?.shorelinePct) setShoreline(series[0].shorelinePct);
        setLastUpdated(new Date().toLocaleTimeString());
        playVideoFromStart();
      } catch (e) {
        console.error("Demo load failed:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const runVideoEvaluation = async (file) => {
    setLoading(true);
    try {
      const token = await getToken();
      const objectUrl = URL.createObjectURL(file);

      setVideoUrl(objectUrl);
      setFrameSeriesPct([]);
      const data = await evaluateOffline(file, 3);
      setShoreline(data?.shoreline || []);
      setCrossedBoundary(Boolean(data?.evaluation?.boundaryCrossed));
      const riskMap = new Map();
      for (const n of data?.evaluation?.nestsAtRisk || []) {
        riskMap.set(n.id, n.distancePct);
      }

      setNests((prev) =>
        prev.map((n) => {
          const d = riskMap.get(n.id);
          return {
            ...n,
            distanceToShoreline: d,
            status: nestStatusFromDistance(d),
          };
        }),
      );

      setLastUpdated(new Date().toLocaleTimeString());

      const fresh = await getAlerts();
      const items = Array.isArray(fresh?.items)
        ? fresh.items
        : Array.isArray(fresh)
          ? fresh
          : [];

      setAlerts(items);
      playVideoFromStart();
    } catch (e) {
      console.error("Video evaluation failed:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const pickNearest = (t) => {
      if (!frameSeriesPct.length) return null;
      let best = frameSeriesPct[0];
      for (const f of frameSeriesPct) {
        if (Math.abs(f.t - t) < Math.abs(best.t - t)) best = f;
      }
      return best;
    };

    const onUpdate = () => {
      const frame = pickNearest(v.currentTime);
      if (!frame) return;

      setShoreline(frame.shorelinePct || []);
      const ev = frame.evaluation;

      if (ev) {
        setCrossedBoundary(Boolean(ev.boundaryCrossed));
        const riskMap = new Map(
          (ev.nestsEvaluated || []).map((n) => [n.id, n.distancePct]),
        );

        setNests((prev) =>
          prev.map((n) => {
            const d = riskMap.get(n.id);
            return {
              ...n,
              distanceToShoreline: d,
              status: nestStatusFromDistance(d),
            };
          }),
        );
      }
    };

    v.addEventListener("timeupdate", onUpdate);
    v.addEventListener("play", onUpdate);

    return () => {
      v.removeEventListener("timeupdate", onUpdate);
      v.removeEventListener("play", onUpdate);
    };
  }, [frameSeriesPct]);

  const highCount =
    nests.filter((n) => n.status === "danger").length +
    (crossedBoundary ? 1 : 0);

  const mediumCount = nests.filter((n) => n.status === "warning").length;

  return (
    <div
      className="min-h-screen space-y-6 bg-[#f4f7fb] p-4 md:p-6 lg:p-8"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Shoreline Risk</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm">Dynamic tracking of erosion and tide risks</p>
          {lastUpdated && <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Last Update: {lastUpdated}</p>}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg cursor-pointer transition-all active:scale-95 text-sm font-bold">
            <Upload className="w-4 h-4" />
            {loading ? "Processing..." : "Analyze Image"}
            <input type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) runOfflineEvaluation(f); e.target.value = ""; }} />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="High Risk"
          value={highCount}
          accent="#ef4444"
          softBg="#fef2f2"
          borderColor="#fecaca"
          icon={AlertTriangle}
          pulse={highCount > 0}
        />

        <StatCard
          label="Warnings"
          value={mediumCount}
          accent="#f59e0b"
          softBg="#fffbeb"
          borderColor="#fde68a"
          icon={MapPin}
          pulse={mediumCount > 0}
        />

        <StatCard
          label="Monitored"
          value={nests.length}
          accent="#0ea5e9"
          softBg="#f0f9ff"
          borderColor="#bae6fd"
          icon={MapPin}
        />

        <StatCard
          label="Boundary"
          value={crossedBoundary ? "BREACH" : "SECURE"}
          sub={
            crossedBoundary ? "immediate response needed" : "within safe range"
          }
          accent={crossedBoundary ? "#ef4444" : "#16a34a"}
          softBg={crossedBoundary ? "#fef2f2" : "#f0fdf4"}
          borderColor={crossedBoundary ? "#fecaca" : "#bbf7d0"}
          icon={crossedBoundary ? ShieldAlert : Shield}
          pulse={crossedBoundary}
        />
      </div>

      {/* Map */}
      <DashboardCard title="Risk Assessment Map" icon={MapPin}>
        <ShorelineBeachMap
          boundary={boundary}
          shoreline={shoreline}
          nests={nests}
          crossedBoundary={crossedBoundary}
        />

        {alerts.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">
            No active shoreline alerts.
          </p>
        )}
      </DashboardCard>

      <DashboardCard title="Active Shoreline Alerts" icon={AlertTriangle}>
        <ShorelineAlertsPanel staffName="Ranger-01" />
        <EnvironmentManualForm />
      </DashboardCard>

      {/* ✅ Demo Video Playback under Map */}
      {videoUrl && (
        <DashboardCard title="Demo Video Playback (AI Tracking)" icon={Video}>
          <ShorelineVideoPlayer
            videoRef={videoRef}
            src={videoUrl}
            frameSeriesPct={frameSeriesPct}
            onTimeShoreline={(pts) => setShoreline(pts)}
          />

          <p className="mt-3 text-sm text-gray-600">
            As the demo video plays, the shoreline updates on the video overlay
            and on the map.
          </p>

          {frameSeriesPct.length > 0 && (
            <p className="mt-1 text-xs text-gray-500">
              Frames processed: {frameSeriesPct.length}
            </p>
          )}
        </DashboardCard>
      )}
    </div>
  );
}
