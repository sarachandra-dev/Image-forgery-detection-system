import { getOutputUrl } from "../services/api";

interface Props {
  heatmapUrl: string | null;
}

export default function HeatmapViewer({ heatmapUrl }: Props) {
  if (!heatmapUrl) return null;
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">GradCAM Heatmap</p>
      <img
        src={getOutputUrl(heatmapUrl)}
        alt="GradCAM heatmap"
        className="rounded-lg max-h-64 object-contain border border-gray-700"
      />
      <p className="text-xs text-gray-500">Red regions indicate suspected tampered areas</p>
    </div>
  );
}
