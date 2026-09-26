import { useEffect, useRef, useState } from "react";
import { Camera, X } from "lucide-react";

interface Props {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function WebcamModal({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let localStream: MediaStream | null = null;
    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 1280, height: 720 } })
      .then((s) => {
        localStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      })
      .catch((err) => {
        setError(`Unable to access webcam: ${err.message || err}`);
      });

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleSnap = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `webcam_${Date.now()}.jpg`, { type: "image/jpeg" });
      onCapture(file);
      onClose();
    }, "image/jpeg", 0.95);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-white font-semibold">
            <Camera className="text-indigo-400" size={20} />
            Live Camera Capture
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 relative rounded-xl overflow-hidden bg-black border border-gray-800 aspect-video flex items-center justify-center">
          {error ? (
            <p className="text-red-400 text-xs text-center px-4">{error}</p>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSnap}
            disabled={!stream}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Camera size={15} /> Capture Photo
          </button>
        </div>
      </div>
    </div>
  );
}
