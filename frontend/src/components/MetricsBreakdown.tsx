import { ShieldAlert, ShieldCheck, Zap, Activity, Cpu, FileSearch, Sparkles } from "lucide-react";
import type { ForensicMetrics, ExifSummary } from "../types/prediction";

interface Props {
  metrics?: ForensicMetrics | null;
  exif?: ExifSummary | null;
  severity?: string;
  tamperAreaPct?: number;
  label: "authentic" | "forged";
  confidence: number;
}

export default function MetricsBreakdown({
  metrics,
  exif,
  severity = "Clean",
  tamperAreaPct = 0,
  label,
  confidence,
}: Props) {
  const isForged = label === "forged";

  const getScoreColor = (score: number) => {
    if (score >= 0.70) return "text-red-400 bg-red-950/40 border-red-700/60";
    if (score >= 0.40) return "text-amber-400 bg-amber-950/40 border-amber-700/60";
    return "text-emerald-400 bg-emerald-950/40 border-emerald-700/60";
  };

  const getBarColor = (score: number) => {
    if (score >= 0.70) return "bg-red-500";
    if (score >= 0.40) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Top Header Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div className="flex items-center gap-3.5">
          <div
            className={`p-3 rounded-xl border ${
              isForged
                ? "bg-red-950/50 border-red-700 text-red-400"
                : "bg-emerald-950/50 border-emerald-700 text-emerald-400"
            }`}
          >
            {isForged ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white capitalize">{label} Image</h2>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  severity === "Critical"
                    ? "bg-red-950 border-red-700 text-red-300"
                    : severity === "High"
                    ? "bg-orange-950 border-orange-700 text-orange-300"
                    : severity === "Moderate"
                    ? "bg-yellow-950 border-yellow-700 text-yellow-300"
                    : "bg-emerald-950 border-emerald-700 text-emerald-300"
                }`}
              >
                Severity: {severity}
              </span>
            </div>
            <p className="text-gray-400 text-xs mt-0.5">
              Multi-factor confidence: <span className="text-white font-mono font-medium">{(confidence * 100).toFixed(1)}%</span> &middot; Tamper footprint: <span className="text-white font-mono font-medium">{tamperAreaPct}%</span> of image
            </p>
          </div>
        </div>

        {/* Global Confidence Pill */}
        <div className="bg-gray-950 border border-gray-800 px-4 py-2.5 rounded-xl text-right">
          <p className="text-[11px] text-gray-500 uppercase tracking-wider font-mono">Calibrated Probability</p>
          <p className={`text-xl font-bold font-mono ${isForged ? "text-red-400" : "text-emerald-400"}`}>
            {(confidence * 100).toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Grid of 5 Forensic Modalities */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Error Level Analysis */}
          <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  <Zap size={14} className="text-indigo-400" />
                  ELA Compression
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-md border font-mono font-semibold ${getScoreColor(metrics.ela_score)}`}>
                  {Math.round(metrics.ela_score * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Mean Error: {metrics.ela_mean} | Hotspots: {metrics.ela_hotspot_ratio}%
              </p>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(metrics.ela_score)}`}
                style={{ width: `${Math.min(100, metrics.ela_score * 100)}%` }}
              />
            </div>
          </div>

          {/* 2. Noise Residual Analysis */}
          <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  <Activity size={14} className="text-cyan-400" />
                  Spatial Noise (SRM)
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-md border font-mono font-semibold ${getScoreColor(metrics.noise_inconsistency)}`}>
                  {Math.round(metrics.noise_inconsistency * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Local block variance inconsistency
              </p>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(metrics.noise_inconsistency)}`}
                style={{ width: `${Math.min(100, metrics.noise_inconsistency * 100)}%` }}
              />
            </div>
          </div>

          {/* 3. Frequency Spectrum Analysis */}
          <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  <Sparkles size={14} className="text-fuchsia-400" />
                  2D FFT Frequency
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-md border font-mono font-semibold ${getScoreColor(metrics.frequency_anomaly)}`}>
                  {Math.round(metrics.frequency_anomaly * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                Resampling & periodic inpainting artifacts
              </p>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(metrics.frequency_anomaly)}`}
                style={{ width: `${Math.min(100, metrics.frequency_anomaly * 100)}%` }}
              />
            </div>
          </div>

          {/* 4. Deep Neural Stream */}
          <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  <Cpu size={14} className="text-purple-400" />
                  Dual-Stream CNN
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-md border font-mono font-semibold ${getScoreColor(metrics.neural_confidence)}`}>
                  {Math.round(metrics.neural_confidence * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-gray-500">
                ResNet50 + ResNet34 feature activations
              </p>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(metrics.neural_confidence)}`}
                style={{ width: `${Math.min(100, metrics.neural_confidence * 100)}%` }}
              />
            </div>
          </div>

          {/* 5. Metadata / EXIF Provenance */}
          <div className="bg-gray-950 border border-gray-800/80 rounded-xl p-4 flex flex-col justify-between sm:col-span-2 lg:col-span-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                  <FileSearch size={14} className="text-amber-400" />
                  Digital Metadata Forensics
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-md border font-mono font-semibold ${getScoreColor(metrics.metadata_risk)}`}>
                  Risk: {Math.round(metrics.metadata_risk * 100)}%
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                {exif?.editing_software_detected
                  ? `Manipulated with software (${exif.software_name || "Unknown editor"})`
                  : exif?.camera_metadata_found
                  ? `Authentic camera hardware tags detected (${exif.camera_make || "Camera"} ${exif.camera_model || ""})`
                  : "No digital camera hardware headers present (stripped or web download)"}
              </p>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getBarColor(metrics.metadata_risk)}`}
                style={{ width: `${Math.min(100, metrics.metadata_risk * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
