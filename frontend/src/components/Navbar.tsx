import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Server } from "lucide-react";
import DevOpsMetricsModal from "./DevOpsMetricsModal";
import { fetchMetrics } from "../services/api";

const links = [
  { to: "/", label: "Detect" },
  { to: "/history", label: "History" },
  { to: "/about", label: "Forensic Engine" },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [showDevOps, setShowDevOps] = useState(false);
  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    fetchMetrics()
      .then((m) => setIsHealthy(m.status === "healthy"))
      .catch(() => setIsHealthy(false));
  }, []);

  return (
    <>
      <nav className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 text-indigo-400 font-bold text-lg group">
          <div className="p-1.5 rounded-lg bg-indigo-950 border border-indigo-700/60 text-indigo-400 group-hover:scale-105 transition-transform">
            <ShieldCheck size={20} />
          </div>
          <span className="text-white font-extrabold tracking-tight">
            Forgery<span className="text-indigo-400">Guard</span>
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/80 ml-1 hidden sm:inline-block">
            v2.0 Real-Time
          </span>
        </Link>

        <div className="flex items-center gap-5">
          <div className="flex gap-4">
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  pathname === to
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* DevOps Live Pipeline Health Button */}
          <button
            onClick={() => setShowDevOps(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-950 border border-gray-800 text-xs text-gray-300 hover:border-indigo-500 hover:text-white transition-all shadow-sm group"
            title="Open DevOps Telemetry & System Health"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isHealthy ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="font-mono text-[11px] hidden sm:inline">DevOps Telemetry</span>
            <Server size={13} className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
          </button>
        </div>
      </nav>

      {showDevOps && <DevOpsMetricsModal onClose={() => setShowDevOps(false)} />}
    </>
  );
}
