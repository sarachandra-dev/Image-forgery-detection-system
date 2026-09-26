import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";

interface Props {
  currentStep?: number;
  stageName?: string;
  detailText?: string;
}

const STAGES = [
  { id: 1, name: "Cryptographic Integrity", detail: "Generating non-repudiable SHA-256 evidence fingerprint..." },
  { id: 2, name: "EXIF & Camera Provenance", detail: "Inspecting hardware tags and software signatures..." },
  { id: 3, name: "Error Level Analysis (ELA)", detail: "Quantizing compression differences across JPEG grids..." },
  { id: 4, name: "Noise & Frequency Spectrum", detail: "Profiling high-frequency sensor noise & 2D FFT harmonics..." },
  { id: 5, name: "Deep CNN & Grad-CAM", detail: "Extracting ResNet50/34 feature representations & gradient maps..." },
  { id: 6, name: "Tamper Localization", detail: "Segmenting anomalous contours & calculating footprint..." },
];

export default function RealtimeProgress({ currentStep = 1, stageName, detailText }: Props) {
  const [activeStep, setActiveStep] = useState(1);

  // If running via standard HTTP, auto-advance smoothly to give real-time feedback
  useEffect(() => {
    if (currentStep) {
      setActiveStep(currentStep);
    }
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < 6 ? prev + 1 : prev));
    }, 450);
    return () => clearInterval(timer);
  }, [currentStep]);

  const currentStage = STAGES[activeStep - 1] || STAGES[0];
  const progressPct = Math.round((activeStep / STAGES.length) * 100);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-white font-semibold text-sm flex items-center gap-2">
          <Loader2 className="animate-spin text-indigo-400" size={16} />
          {stageName || currentStage.name}
        </span>
        <span className="text-indigo-400 font-mono text-xs font-bold">
          {progressPct}%
        </span>
      </div>

      <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden border border-gray-800 mb-4">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/50"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <p className="text-xs text-gray-400 italic mb-5">
        {detailText || currentStage.detail}
      </p>

      {/* Stepper Dots */}
      <div className="grid grid-cols-6 gap-2">
        {STAGES.map((s) => {
          const isDone = activeStep > s.id;
          const isCurrent = activeStep === s.id;
          return (
            <div key={s.id} className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone
                    ? "bg-emerald-600 text-white"
                    : isCurrent
                    ? "bg-indigo-600 text-white ring-4 ring-indigo-500/20 animate-pulse"
                    : "bg-gray-800 text-gray-500"
                }`}
              >
                {isDone ? <CheckCircle2 size={14} /> : s.id}
              </div>
              <span className="text-[10px] text-gray-500 text-center truncate max-w-full font-medium hidden sm:block">
                Step {s.id}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
