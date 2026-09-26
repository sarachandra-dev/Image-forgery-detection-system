import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Layers, Sliders, ZoomIn, Printer, Clock, Hash } from "lucide-react";
import ComparisonSlider from "../components/ComparisonSlider";
import InteractiveViewer from "../components/InteractiveViewer";
import ImageMagnifier from "../components/ImageMagnifier";
import MetricsBreakdown from "../components/MetricsBreakdown";
import TamperRegionsTable from "../components/TamperRegionsTable";
import ExifDrawer from "../components/ExifDrawer";
import ForensicReportModal from "../components/ForensicReportModal";
import type { PredictionResult } from "../types/prediction";

type Tab = "split" | "controls" | "magnifier";

export default function Result() {
  const { state } = useLocation() as {
    state?: { result: PredictionResult; preview: string };
  };
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<Tab>("split");
  const [activeRegionId, setActiveRegionId] = useState<number | null>(null);
  const [showCertificate, setShowCertificate] = useState(false);

  if (!state?.result) {
    navigate("/");
    return null;
  }

  const { result, preview } = state;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Top Navigation & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-xs font-semibold px-3 py-2 rounded-xl bg-gray-900 border border-gray-800"
        >
          <ArrowLeft size={16} /> New Forensic Scan
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCertificate(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all"
          >
            <Printer size={15} /> Export Audit Certificate
          </button>
        </div>
      </div>

      {/* Main Quantitative Breakdown Gauge */}
      <MetricsBreakdown
        metrics={result.metrics}
        exif={result.exif_summary}
        severity={result.severity}
        tamperAreaPct={result.tamper_area_pct}
        label={result.label}
        confidence={result.confidence}
      />

      {/* Interactive Forensic Workspace */}
      <div className="space-y-4">
        {/* Workspace Tab Switcher */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="text-indigo-400" size={18} />
            <h3 className="text-white font-bold text-base">Forensic Examination Workbench</h3>
          </div>

          <div className="flex items-center gap-1 bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
            <button
              onClick={() => setActiveTab("split")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "split"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Layers size={14} /> Split-Screen Comparison
            </button>
            <button
              onClick={() => setActiveTab("controls")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "controls"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Sliders size={14} /> Heatmap & Threshold Tuning
            </button>
            <button
              onClick={() => setActiveTab("magnifier")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === "magnifier"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <ZoomIn size={14} /> 2.5x Pixel Magnifier
            </button>
          </div>
        </div>

        {/* Tab 1: Split-Screen Comparison Slider */}
        {activeTab === "split" && (
          <ComparisonSlider
            originalUrl={preview}
            heatmapUrl={result.heatmap_url}
            elaUrl={result.ela_url}
            noiseUrl={result.noise_url}
            maskUrl={result.mask_url}
          />
        )}

        {/* Tab 2: Interactive Controls & Bounding Boxes */}
        {activeTab === "controls" && (
          <InteractiveViewer
            originalUrl={preview}
            heatmapUrl={result.heatmap_url}
            regions={result.regions}
            activeRegionId={activeRegionId}
            onSelectRegion={setActiveRegionId}
          />
        )}

        {/* Tab 3: Magnifier Loupe */}
        {activeTab === "magnifier" && (
          <ImageMagnifier
            src={preview}
            zoomLevel={2.5}
            label="Pixel Splice Boundary Magnifier"
          />
        )}
      </div>

      {/* Detected Tamper Regions Table */}
      <TamperRegionsTable
        regions={result.regions}
        activeRegionId={activeRegionId}
        onSelectRegion={setActiveRegionId}
      />

      {/* EXIF Metadata Provenance Drawer */}
      <ExifDrawer exif={result.exif_summary} />

      {/* Cryptographic Provenance Bar */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Hash size={15} className="text-indigo-400" />
          <span className="font-mono text-gray-400 truncate max-w-md">
            SHA-256: {result.sha256 || "N/A"}
          </span>
        </div>
        <div className="flex items-center gap-3 font-mono">
          <span className="flex items-center gap-1">
            <Clock size={13} /> {result.inference_time_ms ? `${result.inference_time_ms} ms` : "< 150 ms"}
          </span>
          <span>&middot;</span>
          <span>{new Date(result.created_at).toLocaleString()}</span>
        </div>
      </div>

      {/* Forensic Report Modal */}
      {showCertificate && (
        <ForensicReportModal
          result={result}
          previewUrl={preview}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </div>
  );
}
