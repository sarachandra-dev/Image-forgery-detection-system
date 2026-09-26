import { useEffect, useState } from "react";
import { Trash2, ShieldCheck, ShieldAlert, Search, RefreshCw, Calendar, FileText } from "lucide-react";
import { fetchHistory, deleteRecord } from "../services/api";
import type { HistoryItem } from "../types/prediction";

export default function History() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLabel, setFilterLabel] = useState<"all" | "authentic" | "forged">("all");

  const load = async () => {
    setLoading(true);
    try {
      setItems(await fetchHistory(100, 0));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    await deleteRecord(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.filename.toLowerCase().includes(search.toLowerCase());
    const matchesLabel = filterLabel === "all" || item.label === filterLabel;
    return matchesSearch && matchesLabel;
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Forensic Audit Log</h1>
          <p className="text-gray-400 text-xs mt-0.5">
            Immutable database records of all scanned imagery and forensic determinations
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-semibold transition-colors"
        >
          <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-gray-900/60 p-3 rounded-2xl border border-gray-800">
        <div className="relative flex-1 w-full">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search by filename..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterLabel("all")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex-1 sm:flex-initial ${
              filterLabel === "all"
                ? "bg-indigo-600 text-white"
                : "bg-gray-950 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            All ({items.length})
          </button>
          <button
            onClick={() => setFilterLabel("authentic")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex-1 sm:flex-initial ${
              filterLabel === "authentic"
                ? "bg-emerald-600 text-white"
                : "bg-gray-950 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Authentic ({items.filter((i) => i.label === "authentic").length})
          </button>
          <button
            onClick={() => setFilterLabel("forged")}
            className={`px-3 py-2 rounded-xl text-xs font-semibold transition-colors flex-1 sm:flex-initial ${
              filterLabel === "forged"
                ? "bg-red-600 text-white"
                : "bg-gray-950 text-gray-400 hover:text-white border border-gray-800"
            }`}
          >
            Forged ({items.filter((i) => i.label === "forged").length})
          </button>
        </div>
      </div>

      {/* List */}
      {loading && <p className="text-gray-400 text-xs text-center py-12">Loading records...</p>}

      {!loading && filteredItems.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center">
          <FileText className="mx-auto text-gray-600 mb-3" size={36} />
          <p className="text-gray-400 text-sm font-medium">No forensic logs matching criteria.</p>
          <p className="text-gray-600 text-xs mt-1">Upload and analyze an image to generate audit records.</p>
        </div>
      )}

      <div className="space-y-3">
        {filteredItems.map((item) => {
          const isForged = item.label === "forged";
          return (
            <div
              key={item.id}
              className="flex items-center justify-between bg-gray-900 border border-gray-800 hover:border-gray-700/80 rounded-2xl p-4 transition-all"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isForged
                      ? "bg-red-950/40 border-red-800 text-red-400"
                      : "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                  }`}
                >
                  {isForged ? <ShieldAlert size={20} /> : <ShieldCheck size={20} />}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-sm font-semibold truncate max-w-xs">{item.filename}</p>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold uppercase ${
                        isForged
                          ? "bg-red-950 text-red-400 border border-red-800"
                          : "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>

                  <p className="text-gray-400 text-xs mt-1 flex items-center gap-2">
                    <span className="font-mono text-indigo-400 font-semibold">
                      {(item.confidence * 100).toFixed(1)}% confidence
                    </span>
                    <span>&middot;</span>
                    <span className="flex items-center gap-1 font-mono text-[11px] text-gray-500">
                      <Calendar size={11} /> {new Date(item.created_at).toLocaleString()}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 text-gray-500 hover:text-red-400 hover:bg-gray-800/80 rounded-xl transition-colors"
                  title="Delete record"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
