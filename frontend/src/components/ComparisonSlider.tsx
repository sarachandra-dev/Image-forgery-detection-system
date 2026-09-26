import { useState, useRef, useCallback, useEffect } from "react";
import { MoveHorizontal } from "lucide-react";
import { getOutputUrl } from "../services/api";

interface Props {
  originalUrl: string;
  heatmapUrl?: string | null;
  elaUrl?: string | null;
  noiseUrl?: string | null;
  maskUrl?: string | null;
}

type Mode = "heatmap" | "ela" | "noise" | "mask";

export default function ComparisonSlider({
  originalUrl,
  heatmapUrl,
  elaUrl,
  noiseUrl,
  maskUrl,
}: Props) {
  const [sliderPos, setSliderPos] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<Mode>("heatmap");
  const containerRef = useRef<HTMLDivElement>(null);

  const getTargetUrl = () => {
    switch (mode) {
      case "heatmap":
        return heatmapUrl ? getOutputUrl(heatmapUrl) : null;
      case "ela":
        return elaUrl ? getOutputUrl(elaUrl) : null;
      case "noise":
        return noiseUrl ? getOutputUrl(noiseUrl) : null;
      case "mask":
        return maskUrl ? getOutputUrl(maskUrl) : null;
    }
  };

  const targetUrl = getTargetUrl();

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(pct);
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging && e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
      {/* Top Header & Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <MoveHorizontal className="text-indigo-400" size={20} />
            Interactive Split-Screen Inspector
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Drag the slider horizontally to compare pixel-level forensic evidence against the original
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-gray-950 p-1 rounded-xl border border-gray-800 text-xs">
          <button
            onClick={() => setMode("heatmap")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === "heatmap"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Grad-CAM Heatmap
          </button>
          <button
            onClick={() => setMode("ela")}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              mode === "ela"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ELA Compression
          </button>
          {noiseUrl && (
            <button
              onClick={() => setMode("noise")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === "noise"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Noise Residual
            </button>
          )}
          {maskUrl && (
            <button
              onClick={() => setMode("mask")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                mode === "mask"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Tamper Mask
            </button>
          )}
        </div>
      </div>

      {/* Comparison Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={(e) => {
          setIsDragging(true);
          handleMove(e.clientX);
        }}
        onTouchStart={(e) => {
          setIsDragging(true);
          if (e.touches.length > 0) handleMove(e.touches[0].clientX);
        }}
        className="relative w-full h-[440px] select-none overflow-hidden rounded-xl bg-black border border-gray-800 cursor-ew-resize"
      >
        {/* Underneath: Target Overlay Image */}
        {targetUrl ? (
          <img
            src={targetUrl}
            alt="Forensic evidence"
            className="absolute inset-0 w-full h-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
            Evidence layer not available
          </div>
        )}

        {/* Top clipped layer: Original Image */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={originalUrl}
            alt="Original"
            className="absolute inset-0 w-full h-full object-contain"
            style={{ width: containerRef.current?.clientWidth || "100%", maxWidth: "none" }}
            draggable={false}
          />
          {/* Label left */}
          <span className="absolute top-4 left-4 bg-black/75 backdrop-blur border border-white/10 text-white text-xs px-2.5 py-1 rounded-md font-mono">
            Original Photo
          </span>
        </div>

        {/* Label right */}
        <span className="absolute top-4 right-4 bg-indigo-950/80 backdrop-blur border border-indigo-500/30 text-indigo-300 text-xs px-2.5 py-1 rounded-md font-mono uppercase tracking-wider">
          {mode === "heatmap" ? "Grad-CAM Heatmap" : mode === "ela" ? "ELA Compression" : mode === "noise" ? "Noise Residual" : "Tamper Mask"}
        </span>

        {/* Vertical divider line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]"
          style={{ left: `${sliderPos}%` }}
        >
          {/* Circular handle */}
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-gray-900 flex items-center justify-center shadow-lg border-2 border-indigo-600 transition-transform active:scale-110">
            <MoveHorizontal size={16} />
          </div>
        </div>
      </div>

      {/* Footer Instructions / Quick Slider Control */}
      <div className="flex items-center justify-between mt-3 text-xs text-gray-400">
        <span>Original: {Math.round(sliderPos)}%</span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSliderPos(0)}
            className="hover:text-white px-2 py-0.5 rounded bg-gray-800"
          >
            Show Evidence
          </button>
          <button
            onClick={() => setSliderPos(50)}
            className="hover:text-white px-2 py-0.5 rounded bg-gray-800"
          >
            50/50 Split
          </button>
          <button
            onClick={() => setSliderPos(100)}
            className="hover:text-white px-2 py-0.5 rounded bg-gray-800"
          >
            Show Original
          </button>
        </div>
        <span>Forensic: {Math.round(100 - sliderPos)}%</span>
      </div>
    </div>
  );
}
