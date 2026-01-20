import React, { useEffect, useState } from "react";
import {
  BadgeCheck,
  RefreshCcw,
  Clock,
  CloudRain,
  Waves,
  MapPin,
  ShieldAlert,
} from "lucide-react";

import {
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
} from "./api/shorelineApi.js";
import { COLORS, SectionHeader } from "./Shorelinetheme.jsx";

function RiskBadge({ risk }) {
  const map = {
    high: { color: COLORS.danger, bg: COLORS.dangerSoft, label: "HIGH" },
    medium: { color: COLORS.warning, bg: COLORS.warningSoft, label: "MED" },
    low: { color: COLORS.success, bg: COLORS.successSoft, label: "LOW" },
  };

  const { color, bg, label } = map[risk] || map.low;

  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}

function StatusBadge({ status }) {
  const map = {
    new: { color: COLORS.danger, bg: COLORS.dangerSoft, label: "NEW" },
    acknowledged: {
      color: COLORS.warning,
      bg: COLORS.warningSoft,
      label: "ACK",
    },
    resolved: { color: COLORS.success, bg: COLORS.successSoft, label: "DONE" },
  };

  const { color, bg, label } = map[status] || map.new;

  return (
    <span
      className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider"
      style={{ backgroundColor: bg, color }}
    >
      {label}
    </span>
  );
}

function Chip({ icon: Icon, label, color, bg }) {
  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium"
      style={{ backgroundColor: bg, color }}
    >
      <Icon size={10} />
      {label}
    </div>
  );
}

function ActionBtn({ disabled, onClick, colorClass, label }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${colorClass} ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-sm"
      }`}
    >
      {label}
    </button>
  );
}

function AlertCard({ alert: a, onAck, onResolve, busy }) {
  return (
    <div className="rounded-xl border border-[#e2e8f0] bg-[#fcfdff] p-4 space-y-3 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <RiskBadge risk={a.riskLevel} />
          <StatusBadge status={a.status} />
        </div>

        <div className="flex items-center gap-1.5 text-slate-500">
          <Clock size={11} />
          <span className="text-[10px]">
            {new Date(a.createdAt).toLocaleString()}
          </span>
        </div>
      </div>

      <p className="text-sm font-semibold leading-snug text-slate-700">
        {a.message}
      </p>

      <div className="flex flex-wrap gap-2">
        <Chip
          icon={ShieldAlert}
          label={`Boundary: ${a.details?.evaluation?.boundaryCrossed ? "Crossed" : "Clear"}`}
          color={
            a.details?.evaluation?.boundaryCrossed
              ? COLORS.danger
              : COLORS.success
          }
          bg={
            a.details?.evaluation?.boundaryCrossed
              ? COLORS.dangerSoft
              : COLORS.successSoft
          }
        />

        <Chip
          icon={MapPin}
          label={`${a.details?.evaluation?.nestsAtRisk?.length || 0} nests at risk`}
          color={COLORS.warning}
          bg={COLORS.warningSoft}
        />

        <Chip
          icon={CloudRain}
          label={`${a.details?.environment?.rain?.last3h_mm ?? "—"} mm / 3h`}
          color={COLORS.info}
          bg={COLORS.infoSoft}
        />

        <Chip
          icon={Waves}
          label={`Tide ${a.details?.environment?.tide?.height_m ?? "—"} m · ${a.details?.environment?.tide?.trend ?? "unknown"}`}
          color="#6366f1"
          bg="#eef2ff"
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-[10px] space-x-2 text-slate-500">
          {a.acknowledgedBy && (
            <span>
              Ack: <b>{a.acknowledgedBy}</b>
            </span>
          )}
          {a.resolvedBy && (
            <span>
              Resolved: <b>{a.resolvedBy}</b>
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <ActionBtn
            disabled={a.status !== "new" || busy}
            onClick={() => onAck(a._id)}
            colorClass="bg-amber-50 text-amber-700 border border-amber-200"
            label="Acknowledge"
          />

          <ActionBtn
            disabled={a.status === "resolved" || busy}
            onClick={() => onResolve(a._id)}
            colorClass="bg-green-50 text-green-700 border border-green-200"
            label="Resolve"
          />
        </div>
      </div>
    </div>
  );
}

export default function ShorelineAlertsPanel({
  staffName = "Ranger-01",
  initialItems = [],
}) {
  const [items, setItems] = useState(initialItems);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");

    try {
      const data = await getAlerts(30, 1);
      setItems(data?.items || []);
    } catch (e) {
      setError(e.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, []);

  async function onAck(id) {
    setBusyId(id);
    setError("");

    try {
      await acknowledgeAlert(id, staffName);
      await refresh();
    } catch (e) {
      setError(e.message || "Acknowledge failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onResolve(id) {
    setBusyId(id);
    setError("");

    try {
      await resolveAlert(id, staffName);
      await refresh();
    } catch (e) {
      setError(e.message || "Resolve failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="rounded-2xl border border-[#dbe7f3] bg-white p-5 shadow-sm">
      <SectionHeader
        icon={BadgeCheck}
        title="Active Alerts"
        accent={COLORS.warning}
        right={
          <button
            onClick={refresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#dbe7f3] bg-white px-3 py-2 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition"
          >
            <RefreshCcw size={11} />
            Refresh
          </button>
        }
      />

      {error && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <p className="text-sm text-slate-500">Loading alerts...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-slate-500">No alerts found.</p>
      ) : (
        <div className="space-y-3 max-h-[520px] overflow-auto pr-1">
          {items.map((a) => (
            <AlertCard
              key={a._id}
              alert={a}
              busy={busyId === a._id}
              onAck={onAck}
              onResolve={onResolve}
            />
          ))}
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { CheckCircle2, BadgeCheck, RefreshCcw } from "lucide-react";
import DashboardCard from "../../shared/components/ui/DashboardCard.jsx";

import {
  getAlerts,
  acknowledgeAlert,
  resolveAlert,
} from "./api/shorelineApi.js";

function StatusBadge({ status }) {
  const base = "px-2 py-1 text-xs rounded-full font-semibold";
  if (status === "new")
    return <span className={`${base} bg-red-100 text-red-700`}>NEW</span>;
  if (status === "acknowledged")
    return (
      <span className={`${base} bg-amber-100 text-amber-700`}>
        ACKNOWLEDGED
      </span>
    );
  return (
    <span className={`${base} bg-green-100 text-green-700`}>RESOLVED</span>
  );
}

function RiskBadge({ risk }) {
  const base = "px-2 py-1 text-xs rounded-full font-semibold";
  if (risk === "high")
    return <span className={`${base} bg-rose-100 text-rose-700`}>HIGH</span>;
  if (risk === "medium")
    return (
      <span className={`${base} bg-yellow-100 text-yellow-700`}>MEDIUM</span>
    );
  return <span className={`${base} bg-slate-100 text-slate-700`}>LOW</span>;
}

export default function ShorelineAlertsPanel({ staffName = "Ranger-01" }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  async function refresh() {
    setLoading(true);
    setError("");
    try {
      const data = await getAlerts(30, 1);
      setItems(data?.items || []);
    } catch (e) {
      setError(e.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // optional auto refresh every 10s
    const t = setInterval(refresh, 10000);
    return () => clearInterval(t);
  }, []);

  async function onAck(id) {
    setBusyId(id);
    setError("");
    try {
      await acknowledgeAlert(id, staffName);
      await refresh();
    } catch (e) {
      setError(e.message || "Acknowledge failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onResolve(id) {
    setBusyId(id);
    setError("");
    try {
      await resolveAlert(id, staffName);
      await refresh();
    } catch (e) {
      setError(e.message || "Resolve failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <DashboardCard
      title="Shoreline Alerts (Staff Workflow)"
      icon={BadgeCheck}
      right={
        <button
          onClick={refresh}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
        >
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </button>
      }
    >
      {error && (
        <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <p className="text-sm text-gray-500">Loading alerts...</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-gray-500">No alerts found.</p>
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <div
              key={a._id}
              className="border rounded-2xl p-4 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <RiskBadge risk={a.riskLevel} />
                  <StatusBadge status={a.status} />
                  <span className="text-sm text-gray-500">
                    {new Date(a.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    disabled={a.status !== "new" || busyId === a._id}
                    onClick={() => onAck(a._id)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium
                      ${
                        a.status !== "new" || busyId === a._id
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-amber-600 hover:bg-amber-700 text-white"
                      }`}
                  >
                    Acknowledge
                  </button>

                  <button
                    disabled={a.status === "resolved" || busyId === a._id}
                    onClick={() => onResolve(a._id)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium
                      ${
                        a.status === "resolved" || busyId === a._id
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-green-600 hover:bg-green-700 text-white"
                      }`}
                  >
                    Resolve
                  </button>
                </div>
              </div>

              <p className="mt-3 text-gray-800 font-semibold">{a.message}</p>

              {/* Evidence summary */}
              <div className="mt-2 text-sm text-gray-600">
                Boundary crossed:{" "}
                <b>{String(a.details?.evaluation?.boundaryCrossed)}</b>
                {" • "}
                Nests at risk:{" "}
                <b>{a.details?.evaluation?.nestsAtRisk?.length || 0}</b>
              </div>

              {/* Show who acknowledged/resolved */}
              <div className="mt-2 text-xs text-gray-500">
                {a.acknowledgedBy && (
                  <span className="mr-3">
                    ✅ Ack by <b>{a.acknowledgedBy}</b>
                  </span>
                )}
                {a.resolvedBy && (
                  <span>
                    🟢 Resolved by <b>{a.resolvedBy}</b>
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardCard>
  );
}
