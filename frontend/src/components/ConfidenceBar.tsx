interface Props {
  label: string;
  value: number;
  color?: string;
}

export default function ConfidenceBar({ label, value, color = "bg-indigo-500" }: Props) {
  return (
    <div className="w-full">
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-300 capitalize">{label}</span>
        <span className="text-gray-400">{(value * 100).toFixed(1)}%</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}
