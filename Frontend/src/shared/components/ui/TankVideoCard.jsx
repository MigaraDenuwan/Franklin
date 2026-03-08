import { useState, useEffect } from "react";
import { AlertCircle, ShieldCheck, AlertTriangle, Maximize2, X, Wifi, WifiOff } from "lucide-react";
import { getHatcheryDataUrl } from "../../config";

const FLASK_URL = import.meta.env.VITE_FLASK_URL || "http://localhost:8000";

const getDirectStreamUrl = (tankId) =>
  `${FLASK_URL}/ai/hatchery/stream/${tankId}`;

export default function TankVideoCard({ tankId, tankLabel }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [data, setData] = useState({
    status: "Connecting...",
    health: "Unknown",
    species: "Detecting...",
  });

  useEffect(() => {
    const fetchData = () => {
      fetch(getHatcheryDataUrl(tankId))
        .then((res) => res.json())
        .then(setData)
        .catch(() =>
          setData({
            status: "Offline",
            health: "Unknown",
            species: "Unknown",
          })
        );
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [tankId]);

  const getHealthStyle = (health) => {
    switch (health) {
      case "Critical":
        return {
          bg: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",
          text: "text-red-700 dark:text-red-300",
          icon: <AlertCircle className="w-4 h-4 text-red-500 animate-pulse" />,
        };
      case "Concerning":
        return {
          bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
          text: "text-amber-700 dark:text-amber-300",
          icon: <AlertTriangle className="w-4 h-4 text-amber-500" />,
        };
      case "Healthy":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
          text: "text-emerald-700 dark:text-emerald-300",
          icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />,
        };
      default:
        return {
          bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700",
          text: "text-slate-500 dark:text-slate-400",
          icon: <ShieldCheck className="w-4 h-4 text-slate-400" />,
        };
    }
  };

  const getBehaviorColor = (status) => {
    if (status.includes("CRITICAL")) return "text-red-600 dark:text-red-400";
    if (status.includes("WARNING")) return "text-amber-600 dark:text-amber-400";
    if (status === "Normal") return "text-emerald-600 dark:text-emerald-400";
    return "text-gray-800 dark:text-white";
  };

  const healthStyle = getHealthStyle(data.health);
  const streamUrl = getDirectStreamUrl(tankId);

  return (
    <>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-lg border dark:border-slate-800 overflow-hidden flex flex-col sm:flex-row h-auto sm:h-52">
        
        {/* VIDEO PANEL */}
        <div
          className="relative w-full sm:w-1/2 bg-black cursor-pointer group"
          onClick={() => setIsZoomed(true)}
        >
       
          {!streamError ? (
            <img
              src={streamUrl}
              className="w-full h-full object-cover"
              alt="Live Stream"
              onError={() => setStreamError(true)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-500 p-4">
              <WifiOff className="w-8 h-8 opacity-40" />
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                Stream Offline
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStreamError(false);
                }}
                className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              >
                Retry
              </button>
            </div>
          )}

          {/* Zoom hint overlay */}
          {!streamError && (
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Maximize2 className="w-6 h-6 text-white drop-shadow-lg" />
            </div>
          )}

          {/* Live indicator */}
          {!streamError && (
            <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm px-2 py-1 rounded-md">
              <span className="h-1.5 w-1.5 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-black text-white uppercase tracking-widest">
                Live
              </span>
            </div>
          )}
        </div>

        {/* DATA PANEL */}
        <div className="flex-1 p-4 flex flex-col justify-between">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {tankLabel}
          </h2>

          <div className="space-y-2 my-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Species
              </span>
              <span className="text-sm font-black text-gray-900 dark:text-white">
                {data.species}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase">
                Behavior
              </span>
              <span className={`text-sm font-black ${getBehaviorColor(data.status)}`}>
                {data.status}
              </span>
            </div>
          </div>

          {/* Health Badge */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${healthStyle.bg}`}>
            {healthStyle.icon}
            <span className={`text-xs font-black tracking-widest uppercase ${healthStyle.text}`}>
              Condition: {data.health}
            </span>
          </div>
        </div>
      </div>

      {/* FULLSCREEN MODAL */}
      {isZoomed && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            className="absolute top-6 right-6 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
            onClick={() => setIsZoomed(false)}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center gap-3 max-w-5xl w-full">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-white text-sm font-black uppercase tracking-widest">
                {tankLabel} — Live
              </span>
            </div>
            <img
              src={streamUrl}
              className="w-full object-contain rounded-xl"
              alt="Fullscreen Stream"
            />
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${healthStyle.bg}`}>
              {healthStyle.icon}
              <span className={`text-xs font-black tracking-widest uppercase ${healthStyle.text}`}>
                {data.species} · {data.status} · {data.health}
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
