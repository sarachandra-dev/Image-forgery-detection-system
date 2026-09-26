import { Printer, X, ShieldAlert, ShieldCheck, Hash } from "lucide-react";
import type { PredictionResult } from "../types/prediction";

interface Props {
  result: PredictionResult;
  previewUrl: string;
  onClose: () => void;
}

export default function ForensicReportModal({ result, previewUrl, onClose }: Props) {
  const isForged = result.label === "forged";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-3xl w-full p-8 shadow-2xl relative my-8 print:p-0 print:border-none print:bg-white print:text-black">
        {/* Close & Print Buttons (hidden in print) */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-800 print:hidden">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white">Forensic Audit Certificate</h2>
            <span className="text-xs bg-indigo-950 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded">
              Official Report
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Printer size={15} /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Certificate Content */}
        <div className="mt-6 space-y-6 text-gray-200 print:text-black font-sans">
          {/* Header Badge */}
          <div className="flex items-center justify-between border-b border-gray-800 print:border-gray-300 pb-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white print:text-black">
                DIGITAL FORENSIC EXAMINATION CERTIFICATE
              </h1>
              <p className="text-xs text-gray-400 print:text-gray-600 mt-1">
                Issued by Image Forgery Detection AI & Multi-Modal Forensic Engine
              </p>
            </div>
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 ${
                isForged
                  ? "bg-red-950/40 border-red-700 text-red-400 print:text-red-700"
                  : "bg-emerald-950/40 border-emerald-700 text-emerald-400 print:text-emerald-700"
              }`}
            >
              {isForged ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
              <div className="text-right">
                <p className="text-[10px] uppercase font-bold tracking-widest">Verdict</p>
                <p className="text-base font-extrabold uppercase">{result.label}</p>
              </div>
            </div>
          </div>

          {/* Provenance Metadata Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-gray-950 print:bg-gray-100 p-4 rounded-xl border border-gray-800 print:border-gray-300">
            <div>
              <p className="text-gray-500 font-medium">Record ID</p>
              <p className="font-mono font-semibold text-white print:text-black mt-0.5">#{result.id}</p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Filename</p>
              <p className="font-mono truncate font-semibold text-white print:text-black mt-0.5" title={result.filename}>
                {result.filename}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Timestamp (UTC)</p>
              <p className="font-mono text-white print:text-black mt-0.5">
                {new Date(result.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-500 font-medium">Calibrated Confidence</p>
              <p className="font-mono font-bold text-indigo-400 print:text-indigo-700 mt-0.5">
                {(result.confidence * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          {/* Cryptographic SHA-256 Provenance Fingerprint */}
          {result.sha256 && (
            <div className="p-3 bg-gray-950 print:bg-gray-100 rounded-xl border border-gray-800 print:border-gray-300 flex items-center gap-2">
              <Hash size={16} className="text-indigo-400 shrink-0" />
              <div className="text-[11px] overflow-hidden">
                <span className="text-gray-500 font-medium">Cryptographic SHA-256: </span>
                <span className="font-mono text-gray-300 print:text-black font-semibold break-all">
                  {result.sha256}
                </span>
              </div>
            </div>
          )}

          {/* Visual Evidence Section */}
          <div className="border border-gray-800 print:border-gray-300 rounded-xl p-4 bg-gray-950/60 print:bg-white">
            <h4 className="text-xs font-bold text-gray-300 print:text-gray-800 uppercase tracking-wider mb-3">
              Forensic Visual Evidence
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] text-gray-500 mb-1">Original Evidence File</p>
                <img
                  src={previewUrl}
                  alt="Original"
                  className="rounded-lg h-44 w-full object-contain bg-black border border-gray-800 print:border-gray-300"
                />
              </div>
              <div>
                <p className="text-[11px] text-gray-500 mb-1">Grad-CAM Spatial Localization</p>
                {result.heatmap_url ? (
                  <img
                    src={result.heatmap_url}
                    alt="Heatmap"
                    className="rounded-lg h-44 w-full object-contain bg-black border border-gray-800 print:border-gray-300"
                  />
                ) : (
                  <div className="h-44 flex items-center justify-center bg-gray-900 border border-gray-800 text-xs text-gray-500">
                    No Heatmap Available
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quantitative Metrics Summary */}
          {result.metrics && (
            <div className="border border-gray-800 print:border-gray-300 rounded-xl p-4 bg-gray-950/60 print:bg-white">
              <h4 className="text-xs font-bold text-gray-300 print:text-gray-800 uppercase tracking-wider mb-3">
                Quantitative Forensics Breakdown
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-gray-900 print:bg-gray-50 p-2.5 rounded-lg border border-gray-800 print:border-gray-200">
                  <span className="text-gray-500 text-[10px]">ELA Inconsistency</span>
                  <p className="font-mono font-bold text-white print:text-black">
                    {Math.round(result.metrics.ela_score * 100)}%
                  </p>
                </div>
                <div className="bg-gray-900 print:bg-gray-50 p-2.5 rounded-lg border border-gray-800 print:border-gray-200">
                  <span className="text-gray-500 text-[10px]">Noise Variance</span>
                  <p className="font-mono font-bold text-white print:text-black">
                    {Math.round(result.metrics.noise_inconsistency * 100)}%
                  </p>
                </div>
                <div className="bg-gray-900 print:bg-gray-50 p-2.5 rounded-lg border border-gray-800 print:border-gray-200">
                  <span className="text-gray-500 text-[10px]">FFT 2D Frequency</span>
                  <p className="font-mono font-bold text-white print:text-black">
                    {Math.round(result.metrics.frequency_anomaly * 100)}%
                  </p>
                </div>
                <div className="bg-gray-900 print:bg-gray-50 p-2.5 rounded-lg border border-gray-800 print:border-gray-200">
                  <span className="text-gray-500 text-[10px]">Metadata Risk</span>
                  <p className="font-mono font-bold text-white print:text-black">
                    {Math.round(result.metrics.metadata_risk * 100)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Footer & Examiner Sign-off */}
          <div className="pt-4 border-t border-gray-800 print:border-gray-300 flex justify-between items-end text-xs text-gray-500 print:text-gray-700">
            <div>
              <p>Generated by: Antigravity Real-Time DevOps & Forensic Engine</p>
              <p className="text-[10px] text-gray-600 print:text-gray-500">
                Non-repudiable automated cryptographic forensic certificate
              </p>
            </div>
            <div className="text-right">
              <div className="w-36 border-b border-gray-600 print:border-gray-400 mb-1"></div>
              <p className="font-medium text-gray-400 print:text-black">Forensic Sign-off</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
