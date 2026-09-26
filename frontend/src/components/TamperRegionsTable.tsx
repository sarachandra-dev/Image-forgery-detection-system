import { Target, MapPin } from "lucide-react";
import type { TamperRegion } from "../types/prediction";

interface Props {
  regions?: TamperRegion[];
  activeRegionId?: number | null;
  onSelectRegion?: (id: number | null) => void;
}

export default function TamperRegionsTable({
  regions = [],
  activeRegionId,
  onSelectRegion,
}: Props) {
  if (regions.length === 0) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl text-center py-10">
        <Target className="mx-auto text-emerald-400 mb-2 opacity-80" size={32} />
        <h4 className="text-white font-semibold text-sm">No Localized Splices Detected</h4>
        <p className="text-gray-500 text-xs mt-1 max-w-sm mx-auto">
          Pixel error rates and sensor noise variance across the image are statistically uniform.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-semibold text-lg flex items-center gap-2">
            <Target className="text-amber-400" size={20} />
            Detected Tamper Regions ({regions.length})
          </h3>
          <p className="text-gray-400 text-xs mt-0.5">
            Suspected spliced or cloned bounding boxes extracted via morphological contour clustering
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-400">
              <th className="pb-3 font-semibold">Region</th>
              <th className="pb-3 font-semibold">Coordinates (X, Y)</th>
              <th className="pb-3 font-semibold">Dimension (W × H)</th>
              <th className="pb-3 font-semibold">Tamper Area</th>
              <th className="pb-3 font-semibold">Confidence</th>
              <th className="pb-3 font-semibold">Severity</th>
              <th className="pb-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {regions.map((region) => {
              const isSelected = activeRegionId === region.id;
              return (
                <tr
                  key={region.id}
                  onClick={() => onSelectRegion?.(isSelected ? null : region.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-indigo-950/40 text-white"
                      : "hover:bg-gray-800/50 text-gray-300"
                  }`}
                >
                  <td className="py-3 font-mono font-medium flex items-center gap-1.5">
                    <MapPin size={13} className="text-indigo-400" />#{region.id}
                  </td>
                  <td className="py-3 font-mono text-gray-400">
                    {region.x_pct}% , {region.y_pct}%
                  </td>
                  <td className="py-3 font-mono text-gray-400">
                    {region.w_pct}% × {region.h_pct}%
                  </td>
                  <td className="py-3 font-mono text-amber-300 font-medium">
                    {region.area_pct}%
                  </td>
                  <td className="py-3 font-mono font-medium">
                    {Math.round(region.confidence * 100)}%
                  </td>
                  <td className="py-3">
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-semibold text-[10px] ${
                        region.severity === "Critical"
                          ? "bg-red-950 border border-red-700 text-red-300"
                          : region.severity === "High"
                          ? "bg-orange-950 border border-orange-700 text-orange-300"
                          : region.severity === "Moderate"
                          ? "bg-yellow-950 border border-yellow-700 text-yellow-300"
                          : "bg-emerald-950 border border-emerald-700 text-emerald-300"
                      }`}
                    >
                      {region.severity}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectRegion?.(isSelected ? null : region.id);
                      }}
                      className={`text-xs px-2.5 py-1 rounded transition-colors ${
                        isSelected
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      }`}
                    >
                      {isSelected ? "Focused" : "Locate"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
