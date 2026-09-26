import { useState, useRef } from "react";
import { Sliders, Eye, EyeOff, Target, Sparkles } from "lucide-react";
import type { TamperRegion } from "../types/prediction";
import { getOutputUrl } from "../services/api";

interface Props {
  originalUrl: string;
  heatmapUrl?: string | null;
  regions?: TamperRegion[];
  activeRegionId?: number | null;
  onSelectRegion?: (id: number | null) => void;
}

export default function InteractiveViewer({
  originalUrl,
  heatmapUrl,
  regions = [],
  activeRegionId,
  onSelectRegion,
}: Props) {
  const [opacity, setOpacity] = useState(0.65);
  const [showBoxes, setShowBoxes] = useState(true);
  const [filterThreshold, setFilterThreshold] = useState(0.40);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredRegions = regions.filter((r) => r.confidence >= filterThreshold);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Sliders className="text-indigo-400" size={20} />
            Real-Time Heatmap & Tamper Region Inspector
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Dynamically adjust opacity, filter sensitivity threshold, and inspect suspected bounding boxes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBoxes(!showBoxes)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              showBoxes
                ? "bg-indigo-950/60 border-indigo-700 text-indigo-300"
                : "bg-gray-950 border-gray-800 text-gray-400 hover:text-white"
            }`}
          >
            {showBoxes ? <Eye size={14} /> : <EyeOff size={14} />}
            {showBoxes ? "Bounding Boxes (ON)" : "Boxes (OFF)"}
          </button>
        </div>
      </div>

      {/* Main Image Overlay Area with Responsive Bounding Boxes */}
      <div
        ref={containerRef}
        className="relative w-full h-[460px] rounded-xl overflow-hidden bg-black border border-gray-800 flex items-center justify-center select-none"
      >
        {/* Original Base Image */}
        <img
          src={originalUrl}
          alt="Original base"
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* Heatmap Overlay with dynamic CSS opacity */}
        {heatmapUrl && (
          <img
            src={getOutputUrl(heatmapUrl)}
            alt="Heatmap overlay"
            className="absolute inset-0 w-full h-full object-contain mix-blend-screen transition-opacity duration-150 pointer-events-none"
            style={{ opacity }}
          />
        )}

        {/* Detected Tamper Bounding Boxes */}
        {showBoxes && (
          <div className="absolute inset-0 w-full h-full pointer-events-none">
            {filteredRegions.map((region) => {
              const isActive = activeRegionId === region.id;
              const borderColor =
                region.severity === "Critical"
                  ? "border-red-500 shadow-red-500/50"
                  : region.severity === "High"
                  ? "border-orange-500 shadow-orange-500/50"
                  : "border-yellow-400 shadow-yellow-400/50";

              return (
                <div
                  key={region.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectRegion?.(isActive ? null : region.id);
                  }}
                  className={`absolute pointer-events-auto cursor-pointer border-2 transition-all rounded-sm ${borderColor} ${
                    isActive
                      ? "ring-4 ring-indigo-400 ring-offset-2 ring-offset-black bg-indigo-500/20"
                      : "hover:bg-white/10"
                  }`}
                  style={{
                    left: `${region.x_pct}%`,
                    top: `${region.y_pct}%`,
                    width: `${region.w_pct}%`,
                    height: `${region.h_pct}%`,
                  }}
                >
                  <span
                    className={`absolute -top-6 left-0 text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold text-white shadow whitespace-nowrap ${
                      region.severity === "Critical"
                        ? "bg-red-600"
                        : region.severity === "High"
                        ? "bg-orange-600"
                        : "bg-yellow-600"
                    }`}
                  >
                    Region #{region.id} ({Math.round(region.confidence * 100)}%)
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Real-time Interactive Control Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 bg-gray-950 p-4 rounded-xl border border-gray-800/80">
        {/* Opacity Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium flex items-center gap-1.5">
              <Sparkles size={14} className="text-indigo-400" />
              Heatmap Blend Opacity
            </span>
            <span className="text-indigo-400 font-mono font-semibold">
              {Math.round(opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Original Only (0%)</span>
            <span>Balanced (65%)</span>
            <span>Full Heatmap (100%)</span>
          </div>
        </div>

        {/* Sensitivity / Region Filter Threshold Slider */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-gray-300 font-medium flex items-center gap-1.5">
              <Target size={14} className="text-amber-400" />
              Detection Sensitivity Threshold
            </span>
            <span className="text-amber-400 font-mono font-semibold">
              {(filterThreshold * 100).toFixed(0)}% ({filteredRegions.length} regions)
            </span>
          </div>
          <input
            type="range"
            min="0.10"
            max="0.85"
            step="0.05"
            value={filterThreshold}
            onChange={(e) => setFilterThreshold(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>High Sensitivity (Show all)</span>
            <span>Balanced</span>
            <span>Strict (High confidence only)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
