interface Props {
  src: string;
  label?: string;
}

export default function ImagePreview({ src, label }: Props) {
  return (
    <div className="flex flex-col items-center gap-2">
      {label && <p className="text-xs text-gray-400 uppercase tracking-widest">{label}</p>}
      <img
        src={src}
        alt={label}
        className="rounded-lg max-h-64 object-contain border border-gray-700 bg-gray-900"
      />
    </div>
  );
}
