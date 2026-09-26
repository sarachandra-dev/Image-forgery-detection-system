import { ShieldCheck, ShieldAlert } from "lucide-react";
import type { PredictionResult } from "../types/prediction";
import ConfidenceBar from "./ConfidenceBar";

interface Props {
  result: PredictionResult;
}

export default function ResultCard({ result }: Props) {
  const isForged = result.label === "forged";

  return (
    <div className={`rounded-xl border p-6 ${isForged ? "border-red-700 bg-red-950/20" : "border-green-700 bg-green-950/20"}`}>
      <div className="flex items-center gap-3 mb-4">
        {isForged
          ? <ShieldAlert size={28} className="text-red-400" />
          : <ShieldCheck size={28} className="text-green-400" />}
        <div>
          <p className={`text-xl font-bold capitalize ${isForged ? "text-red-400" : "text-green-400"}`}>
            {result.label}
          </p>
          <p className="text-gray-400 text-sm">{result.filename}</p>
        </div>
      </div>

      <div className="space-y-3">
        <ConfidenceBar
          label="Authentic"
          value={result.probabilities.authentic}
          color="bg-green-500"
        />
        <ConfidenceBar
          label="Forged"
          value={result.probabilities.forged}
          color="bg-red-500"
        />
      </div>
    </div>
  );
}
