import { X, Activity, Minus, Plus, ChevronDown, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import { SEAS } from "@/types/map";
import { type RegionData } from "@/types/map";

interface DashboardProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  seaIndex: number;
  setSeaIndex: (index: number) => void;
  filterSeaIndex: number;
  setFilterSeaIndex: (index: number) => void;
  selectedFish: string | null;
  setSelectedFish: (fish: string | null) => void;
  regionsData: RegionData[];
  trackerData: any[];
  isLiveStatusExpanded: boolean;
  setIsLiveStatusExpanded: (open: boolean) => void;
}

export default function SidebarDashboard({
  isSidebarOpen,
  setIsSidebarOpen,
  setSeaIndex,
  filterSeaIndex,
  setFilterSeaIndex,
  selectedFish,
  setSelectedFish,
  regionsData,
  trackerData,
  isLiveStatusExpanded,
  setIsLiveStatusExpanded,
}: DashboardProps) {
  const getFullSpeciesName = (region: RegionData) => {
    return `${region.commonSpeciesName} (${region.scientificSpeciesName})`;
  };

  const availableFishes = useMemo(() => {
    return filterSeaIndex === 0
      ? regionsData
      : regionsData.filter((r) =>
          r.regionNames.includes(SEAS[filterSeaIndex].name),
        );
  }, [filterSeaIndex, regionsData]);

  return (
    <div
      className={`pointer-events-auto flex flex-col text-white fixed top-5 md:top-25 left-10 w-80 max-h-[80vh] glass-nav rounded-4xl p-6 z-50 transform transition-transform tracking-wide ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-[calc(100%+50px)]"
      } shadow-2xl overflow-hidden`}
    >
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h2 className="font-medium text-lg">Dashboard</h2>
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="p-1.5 hover:bg-slate-600 rounded-full transition-colors cursor-pointer"
        >
          <X size={20} strokeWidth={3} className="text-slate-200" />
        </button>
      </div>

      <div className="flex flex-col gap-4 shrink-0">
        {/* CUSTOM DROPDOWN 1: Sea Selection */}
        <div className="relative w-full">
          <select
            value={filterSeaIndex}
            onChange={(e) => {
              const idx = Number(e.target.value);
              setSelectedFish(null);
              setFilterSeaIndex(idx);
              setSeaIndex(idx);
            }}
            className="w-full p-2 pr-10 border border-slate-400 rounded-xl text-[15px] outline-none cursor-pointer bg-slate-800 text-white font-medium appearance-none"
          >
            {SEAS.map((sea, index) => (
              <option key={index} value={index}>
                {sea.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300"
          />
        </div>

        {/* CUSTOM DROPDOWN 2: Fish Selection */}
        <div className="relative w-full">
          <select
            value={selectedFish || "all"}
            onChange={(e) => {
              if (e.target.value === "all") {
                setSelectedFish(null);
              } else {
                setSelectedFish(e.target.value);
                const fishRegion = regionsData.find(
                  (r) => r.id === e.target.value,
                );
                if (fishRegion) {
                  const supportsCurrentFilter =
                    filterSeaIndex === 0 ||
                    fishRegion.regionNames.includes(SEAS[filterSeaIndex].name);
                  if (
                    !supportsCurrentFilter &&
                    fishRegion.regionNames.length > 0
                  ) {
                    const targetIndex = SEAS.findIndex(
                      (s) => s.name === fishRegion.regionNames[0],
                    );
                    if (targetIndex !== -1) {
                      setFilterSeaIndex(targetIndex);
                      setSeaIndex(targetIndex);
                    }
                  }
                }
              }
            }}
            className="w-full p-2 pr-10 border border-slate-400 rounded-xl text-[15px] outline-none cursor-pointer bg-slate-800 text-white font-medium appearance-none"
          >
            <option value="all">All Fishes</option>
            {availableFishes.map((r) => (
              <option key={r.id} value={r.id}>
                {getFullSpeciesName(r)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300"
          />
        </div>

        <button
          onClick={() => {
            setSelectedFish(null);
            setFilterSeaIndex(0);
            setSeaIndex(0);
          }}
          className="w-full mt-1 py-2 px-3 border border-slate-600 bg-slate-800/20 hover:bg-slate-700/40 rounded-xl text-sm tracking-widest text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
        >
          <RotateCcw size={16} />
          Reset Filters
        </button>
      </div>

      <div className="my-5 border-t border-slate-600/50 shrink-0"></div>

      <div className="flex items-center justify-between mb-3 shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="text-emerald-400 w-4 h-4 animate-pulse" />
          <h3 className="font-medium text-[15px] tracking-wide text-white">
            Live Status
          </h3>
        </div>
        <button
          onClick={() => setIsLiveStatusExpanded(!isLiveStatusExpanded)}
          className="p-1 hover:bg-slate-600 rounded-full transition-colors cursor-pointer text-slate-300"
        >
          {isLiveStatusExpanded ? (
            <Minus size={16} strokeWidth={3} className="text-slate-200" />
          ) : (
            <Plus size={16} strokeWidth={3} className="text-slate-200" />
          )}
        </button>
      </div>

      {isLiveStatusExpanded && (
        <div className="flex flex-col gap-3 overflow-y-auto pr-1 custom-scrollbar pb-2">
          {trackerData?.map((data) => {
            if (
              filterSeaIndex !== 0 &&
              !data.region.regionNames.includes(SEAS[filterSeaIndex].name)
            ) {
              return null;
            }

            const isHighlighted = selectedFish === data.region.id;
            const avgThreat = (data.stats.average_threat_score * 100).toFixed(
              3,
            );
            const maxThreat = (data.stats.maximum_threat_score * 100).toFixed(
              3,
            );

            return (
              <div
                key={data.region.id}
                onClick={() => {
                  setSelectedFish(data.region.id);
                  const supportsCurrentFilter =
                    filterSeaIndex === 0 ||
                    data.region.regionNames.includes(SEAS[filterSeaIndex].name);
                  if (!supportsCurrentFilter && data.region.regionNames.length > 0) {
                    const newSeaIndex = SEAS.findIndex((s) =>
                      data.region.regionNames.includes(s.name),
                    );
                    if (newSeaIndex !== -1) {
                      setSeaIndex(newSeaIndex);
                      setFilterSeaIndex(newSeaIndex);
                    }
                  }
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  isHighlighted
                    ? "border-slate-400 bg-slate-700 shadow-[0_0_10px_rgba(255,255,255,0.05)]"
                    : "border-slate-600/30 bg-slate-800/40 opacity-70 hover:opacity-100 hover:bg-slate-700/50"
                }`}
              >
                <h4 className="font-medium text-white text-[14px] mb-1.5 leading-tight">
                  {data.region.commonSpeciesName}
                </h4>
                <div className="flex justify-between text-[12.5px] mt-2 text-slate-300">
                  <span className="font-medium">Vessels:</span>
                  <span className="font-mono text-white font-medium">
                    {data.stats.vessels_tracked_count}
                  </span>
                </div>
                <div className="flex justify-between text-[12.5px] mt-1 text-slate-300">
                  <span className="font-medium">Avg Threat:</span>
                  <span className="font-mono text-yellow-400 font-medium">
                    {avgThreat}%
                  </span>
                </div>
                <div className="flex justify-between text-[12.5px] mt-1 text-slate-300">
                  <span className="font-medium">Max Threat:</span>
                  <span className="font-mono text-rose-400 font-medium">
                    {maxThreat}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
