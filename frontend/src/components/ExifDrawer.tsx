import { useState } from "react";
import { FileSearch, ChevronDown, ChevronUp, AlertCircle } from "lucide-react";
import type { ExifSummary } from "../types/prediction";

interface Props {
  exif?: ExifSummary | null;
}

export default function ExifDrawer({ exif }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  if (!exif) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-950/40 border border-indigo-800 text-indigo-400">
            <FileSearch size={20} />
          </div>
          <div>
            <h3 className="text-white font-semibold text-base flex items-center gap-2">
              Metadata & EXIF Forensic Provenance
              {exif.editing_software_detected && (
                <span className="text-[10px] bg-red-950 text-red-300 border border-red-700 px-2 py-0.5 rounded font-mono">
                  Editor Traces
                </span>
              )}
            </h3>
            <p className="text-gray-400 text-xs mt-0.5">
              {exif.camera_metadata_found
                ? `Original Hardware: ${exif.camera_make || "Camera"} ${exif.camera_model || ""}`
                : "No camera hardware signature present in header"}
            </p>
          </div>
        </div>

        <button className="text-gray-400 hover:text-white p-1 rounded-lg">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isOpen && (
        <div className="mt-5 pt-5 border-t border-gray-800 space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
              <span className="text-gray-500 font-medium">Software Fingerprint</span>
              <p className="font-semibold text-white mt-1">
                {exif.editing_software_detected
                  ? `Manipulated with ${exif.software_name}`
                  : "None Detected"}
              </p>
            </div>
            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
              <span className="text-gray-500 font-medium">Camera Hardware Tags</span>
              <p className="font-semibold text-white mt-1">
                {exif.camera_metadata_found ? "Present (Authentic Sensor)" : "Missing / Stripped"}
              </p>
            </div>
            <div className="bg-gray-950 p-3 rounded-xl border border-gray-800">
              <span className="text-gray-500 font-medium">Metadata Anomaly Score</span>
              <p className="font-semibold text-amber-400 font-mono mt-1">
                {Math.round(exif.metadata_risk_score * 100)}% Risk
              </p>
            </div>
          </div>

          {exif.suspicious_flags.length > 0 && (
            <div className="bg-red-950/20 border border-red-900/60 p-3.5 rounded-xl">
              <span className="text-red-400 font-semibold flex items-center gap-1.5 mb-2">
                <AlertCircle size={14} /> Suspicious Forensic Indicators:
              </span>
              <ul className="space-y-1 pl-5 list-disc text-gray-300">
                {exif.suspicious_flags.map((flag, idx) => (
                  <li key={idx}>{flag}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
