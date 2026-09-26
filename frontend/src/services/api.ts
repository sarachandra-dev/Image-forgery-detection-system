import axios from "axios";
import type { PredictionResult, HistoryItem, SampleItem, DevOpsMetrics } from "../types/prediction";

export const API_BASE_URL = "http://localhost:8000";

const api = axios.create({ baseURL: `${API_BASE_URL}/api` });

export const predictImage = async (file: File): Promise<PredictionResult> => {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<PredictionResult>("/predict", form);
  return data;
};

export const fetchHistory = async (limit = 50, offset = 0): Promise<HistoryItem[]> => {
  const { data } = await api.get<HistoryItem[]>("/history", { params: { limit, offset } });
  return data;
};

export const deleteRecord = async (id: number): Promise<void> => {
  await api.delete(`/history/${id}`);
};

export const fetchSamples = async (): Promise<SampleItem[]> => {
  const { data } = await api.get<SampleItem[]>("/samples");
  return data;
};

export const fetchMetrics = async (): Promise<DevOpsMetrics> => {
  const { data } = await api.get<DevOpsMetrics>("/metrics");
  return data;
};

export const fetchSampleFile = async (url: string, filename: string): Promise<File> => {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
  const response = await fetch(fullUrl);
  const blob = await response.blob();
  return new File([blob], filename, { type: blob.type || "image/jpeg" });
};

export const getOutputUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
