import { getOutputUrl } from "../services/api";

interface Props {
  elaUrl: string | null;
}

export default function ELAPreview({ elaUrl }: Props) {
  if (!elaUrl) return null;
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest">Error Level Analysis</p>
      <img
        src={getOutputUrl(elaUrl)}
        alt="ELA output"
        className="rounded-lg max-h-64 object-contain border border-gray-700"
      />
      <p className="text-xs text-gray-500">Bright areas indicate inconsistent compression levels</p>
    </div>
  );
}
