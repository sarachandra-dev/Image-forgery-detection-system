import { useCallback, useState, useEffect } from "react";
import { UploadCloud, Camera, Clipboard } from "lucide-react";
import WebcamModal from "./WebcamModal";

interface Props {
  onFile: (file: File) => void;
  disabled?: boolean;
}

export default function ImageUploader({ onFile, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const [showWebcam, setShowWebcam] = useState(false);
  const [pasteNotification, setPasteNotification] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) onFile(file);
    },
    [onFile]
  );

  // Clipboard paste listener (Ctrl+V anywhere on window)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (disabled) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            onFile(file);
            setPasteNotification(true);
            setTimeout(() => setPasteNotification(false), 2500);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [onFile, disabled]);

  return (
    <>
      <div className="space-y-3">
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-250 relative overflow-hidden group
            ${
              dragging
                ? "border-indigo-400 bg-indigo-950/40 shadow-xl shadow-indigo-500/20"
                : "border-gray-700 bg-gray-900/90 hover:border-indigo-500 hover:bg-gray-900"
            }
            ${disabled ? "opacity-50 pointer-events-none" : ""}`}
        >
          <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-800/80 text-indigo-400 mb-3 group-hover:scale-110 transition-transform">
            <UploadCloud size={32} />
          </div>

          <p className="text-gray-200 font-semibold text-sm">
            Drag & drop image here, or <span className="text-indigo-400 underline underline-offset-2">browse file</span>
          </p>
          <p className="text-gray-400 text-xs mt-1 flex items-center gap-1.5">
            <Clipboard size={12} className="text-indigo-400" /> Or paste screenshot directly (<kbd className="px-1 py-0.5 rounded bg-gray-800 text-[10px] font-mono border border-gray-700 text-gray-300">Ctrl + V</kbd>)
          </p>

          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={disabled}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />

          {pasteNotification && (
            <div className="absolute inset-x-0 bottom-2 text-center">
              <span className="bg-emerald-600 text-white text-xs px-3 py-1 rounded-full font-medium shadow-lg animate-bounce inline-block">
                ✓ Image pasted from clipboard!
              </span>
            </div>
          )}
        </label>

        {/* Action Row: Live Camera & Quick Paste button */}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowWebcam(true)}
            disabled={disabled}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 border border-gray-800 text-gray-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-50 shadow-sm"
          >
            <Camera size={14} className="text-indigo-400" />
            Capture with Live Webcam
          </button>
        </div>
      </div>

      {showWebcam && (
        <WebcamModal
          onCapture={(file) => {
            onFile(file);
            setShowWebcam(false);
          }}
          onClose={() => setShowWebcam(false)}
        />
      )}
    </>
  );
}
