import { useEffect, useState } from "react";
import { Sparkles, ShieldCheck, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { fetchSamples, fetchSampleFile } from "../services/api";
import type { SampleItem } from "../types/prediction";

interface Props {
  onSelectSample: (file: File) => void;
  disabled?: boolean;
}

export default function SampleGallery({ onSelectSample, disabled }: Props) {
  const [samples, setSamples] = useState<SampleItem[]>([]);
  const [activeLoadingId, setActiveLoadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSamples()
      .then((data) => setSamples(data))
      .catch((e) => console.error("Failed to load samples", e));
  }, []);

  const handleClick = async (sample: SampleItem) => {
    if (disabled || activeLoadingId) return;
    setActiveLoadingId(sample.id);
    try {
      const file = await fetchSampleFile(sample.url, sample.filename);
      onSelectSample(file);
    } catch (err) {
      console.error("Failed to fetch sample image file", err);
    } finally {
      setActiveLoadingId(null);
    }
  };

  if (samples.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="text-indigo-400" size={16} />
          <h3 className="text-white font-semibold text-sm">Quick-Test Forensic Samples</h3>
        </div>
        <span className="text-gray-500 text-xs">1-Click Instant Analysis</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {samples.map((s) => {
          const isForged = s.category === "forged";
          const isLoadingThis = activeLoadingId === s.id;

          return (
            <div
              key={s.id}
              onClick={() => handleClick(s)}
              className={`group bg-gray-900 border border-gray-800 hover:border-indigo-500/80 rounded-xl p-3 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/10 flex flex-col justify-between ${
                disabled ? "opacity-50 pointer-events-none" : ""
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase flex items-center gap-1 ${
                      isForged
                        ? "bg-red-950/60 text-red-400 border border-red-800"
                        : "bg-emerald-950/60 text-emerald-400 border border-emerald-800"
                    }`}
                  >
                    {isForged ? <ShieldAlert size={10} /> : <ShieldCheck size={10} />}
                    {s.category}
                  </span>
                  {isLoadingThis && <Loader2 size={13} className="animate-spin text-indigo-400" />}
                </div>

                <h4 className="text-white font-medium text-xs group-hover:text-indigo-300 transition-colors">
                  {s.title}
                </h4>
                <p className="text-gray-400 text-[11px] line-clamp-2 mt-1 leading-relaxed">
                  {s.description}
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-gray-800/80 flex items-center justify-between text-[11px] text-indigo-400 font-medium">
                <span>Test this image</span>
                <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
