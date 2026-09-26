import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, Zap, CheckCircle2 } from "lucide-react";
import ImageUploader from "../components/ImageUploader";
import RealtimeProgress from "../components/RealtimeProgress";
import SampleGallery from "../components/SampleGallery";
import { predictImage } from "../services/api";

export default function Home() {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFile = (f: File) => {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const handleAnalyze = async () => {
    if (!file || loading) return;
    setLoading(true);
    setError(null);

    try {
      const result = await predictImage(file);
      navigate("/result", { state: { result, preview } });
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Forensic analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-xs font-semibold mb-4 shadow-sm">
          <Sparkles size={13} className="text-indigo-400" />
          Multi-Modal Forensic AI & ResNet Dual-Stream Saliency
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Real-Time Image <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Forgery Detection</span>
        </h1>
        <p className="text-gray-400 max-w-xl mx-auto text-sm sm:text-base leading-relaxed">
          Forensically authenticate images in real time using Error Level Analysis (ELA), spatial sensor noise residuals, 2D FFT harmonics, and Grad-CAM neural tamper localization.
        </p>
      </div>

      {/* Main Upload Zone */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-sm">
        <ImageUploader onFile={handleFile} disabled={loading} />

        {/* Selected Image Preview */}
        {preview && file && !loading && (
          <div className="mt-6 p-4 bg-gray-950 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-center gap-4">
            <img
              src={preview}
              alt="Selected"
              className="w-24 h-24 object-cover rounded-xl border border-gray-700 shrink-0"
            />
            <div className="flex-1 text-center sm:text-left">
              <p className="text-white font-semibold text-sm truncate max-w-xs">{file.name}</p>
              <p className="text-gray-400 text-xs mt-0.5 font-mono">
                Size: {(file.size / (1024 * 1024)).toFixed(2)} MB &middot; Type: {file.type || "image/jpeg"}
              </p>
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 mt-2">
                <CheckCircle2 size={13} /> Ready for forensic scanning
              </span>
            </div>
            <button
              onClick={handleAnalyze}
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 group"
            >
              <Zap size={16} /> Run Forensic Scan
              <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {/* Real-time Progress Stepper */}
        {loading && (
          <div className="mt-6">
            <RealtimeProgress />
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="mt-6 p-4 bg-red-950/40 border border-red-800 rounded-xl text-red-400 text-xs">
            {error}
          </div>
        )}

        {/* 1-Click Test Samples */}
        <SampleGallery onSelectSample={handleFile} disabled={loading} />
      </div>
    </div>
  );
}
