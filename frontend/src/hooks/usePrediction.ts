import { useState } from "react";
import { predictImage } from "../services/api";
import type { PredictionResult } from "../types/prediction";

export function usePrediction() {
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const predict = async (file: File) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await predictImage(file);
      setResult(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? "Prediction failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
  };

  return { result, loading, error, predict, reset };
}
