import { useEffect, useState } from "react";
import { X, RefreshCw, Cpu, Server, CheckCircle2, AlertTriangle, Layers } from "lucide-react";
import { fetchMetrics } from "../services/api";
import type { DevOpsMetrics } from "../types/prediction";

interface Props {
  onClose: () => void;
}

export default function DevOpsMetricsModal({ onClose }: Props) {
  const [metrics, setMetrics] = useState<DevOpsMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchMetrics();
      setMetrics(data);
    } catch (e: any) {
      setError(e.message || "Failed to fetch DevOps telemetry");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    const interval = setInterval(loadMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Server className="text-emerald-400" size={22} />
            <div>
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                DevOps Live Telemetry & Pipeline Health
                <span className="flex items-center gap-1 text-[11px] font-normal px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Real-Time
                </span>
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadMetrics}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
              title="Refresh"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-950/40 border border-red-800 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {metrics && (
          <div className="mt-6 space-y-5 text-xs">
            {/* System Status Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <p className="text-gray-500 font-medium">Pipeline Status</p>
                <p className="text-emerald-400 font-bold font-mono text-sm mt-0.5 capitalize flex items-center gap-1.5">
                  <CheckCircle2 size={14} /> {metrics.status}
                </p>
              </div>
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <p className="text-gray-500 font-medium">Uptime</p>
                <p className="text-white font-bold font-mono text-sm mt-0.5">
                  {metrics.uptime_formatted}
                </p>
              </div>
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <p className="text-gray-500 font-medium">Process Memory</p>
                <p className="text-indigo-400 font-bold font-mono text-sm mt-0.5">
                  {metrics.system.process_memory_mb} MB
                </p>
              </div>
              <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
                <p className="text-gray-500 font-medium">Compute Device</p>
                <p className="text-purple-400 font-bold font-mono text-sm mt-0.5 uppercase">
                  {metrics.system.device} ({metrics.system.cuda_available ? "CUDA" : "CPU"})
                </p>
              </div>
            </div>

            {/* Model & Neural Pipeline */}
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <h4 className="text-gray-300 font-semibold mb-2 flex items-center gap-1.5">
                <Cpu size={14} className="text-indigo-400" />
                Inference Engine & Weights
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-400">
                <div>
                  <span className="text-gray-500">Architecture: </span>
                  <span className="text-white font-medium">{metrics.model.name}</span>
                </div>
                <div>
                  <span className="text-gray-500">Weights File: </span>
                  <span className="font-mono text-emerald-400">
                    {metrics.model.weights_exist ? "✓ Loaded & Ready" : "Standby"}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800/80">
                <span className="text-gray-500 block mb-1.5 font-medium">Active Forensic Modules:</span>
                <div className="flex flex-wrap gap-1.5">
                  {metrics.model.forensics_modules.map((mod, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-gray-900 border border-gray-800 text-gray-300 text-[10px]"
                    >
                      {mod}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Analytics Telemetry */}
            <div className="bg-gray-950 p-4 rounded-xl border border-gray-800">
              <h4 className="text-gray-300 font-semibold mb-2 flex items-center gap-1.5">
                <Layers size={14} className="text-amber-400" />
                Detection Throughput Analytics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div>
                  <p className="text-gray-500 text-[11px]">Total Scans</p>
                  <p className="text-lg font-bold font-mono text-white mt-0.5">
                    {metrics.analytics.total_scans}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px]">Authentic Ratio</p>
                  <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                    {metrics.analytics.authentic_scans}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px]">Forged Ratio</p>
                  <p className="text-lg font-bold font-mono text-red-400 mt-0.5">
                    {metrics.analytics.forged_scans} ({metrics.analytics.forged_ratio_pct}%)
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-[11px]">Avg Confidence</p>
                  <p className="text-lg font-bold font-mono text-indigo-400 mt-0.5">
                    {(metrics.analytics.average_confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
