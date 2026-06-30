import { Trash2 } from "lucide-react"

type TrackedVessel = {
    mmsi: string;
    vessel_name: string;
    score: number;
    level: "CRITICAL" | "WARNING" | "LOW";
    distance_km: number;
    sog: number;
};

export type UserReport = {
    id: number;
    species_id: string;
    species_name: string | null;
    month: number;
    bbox: number[];
    sea_surface_temp: number | null;
    vessel_count: number;
    avg_score: number | null;
    max_score: number | null;
    created_at: string;
    snapshot: {
        tracked_vessels?: TrackedVessel[];
    };
};

type ReportPanelProps = {
    report: UserReport;
    onDelete: (reportId: number) => void;
};

function formatPercent(score?: number | null) {
    return `${Math.round((score ?? 0) * 100)}%`;
}

function getRiskColor(level: string) {
    if (level === "CRITICAL") return "text-red-700";
    if (level === "WARNING") return "text-yellow-600";
    return "text-emerald-700";
}

function ScoreBox({
    label,
    value,
    color,
}: {
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="rounded-[1.25rem] border border-white/40 bg-white/15 px-10 py-4 text-center shadow-md backdrop-blur-md">
            <p className="font-cal text-base text-black">{label}</p>
            <p className={`font-righteous text-6xl leading-none ${color}`}>
                {value}
            </p>
        </div>
    );
}

export default function ReportPanel({ report, onDelete }: ReportPanelProps) {
    const vessels = report.snapshot.tracked_vessels ?? [];

    return (
        <section className="rounded-[2rem] border border-white/40 bg-white/15 px-8 py-10 shadow-lg backdrop-blur-md md:px-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                <div>
                    <h3 className="font-cal text-5xl text-black md:text-6xl">
                        {report.species_name ?? report.species_id}
                    </h3>

                    <p className="mt-5 font-cal text-2xl text-black">
                        Month {report.month} - Report #{report.id}
                    </p>

                    <p className="mt-2 text-lg text-blue-950">
                        Created {new Date(report.created_at).toLocaleDateString()}
                    </p>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row">
                    <ScoreBox
                        label="Overlap Score Max"
                        value={formatPercent(report.max_score)}
                        color="text-red-700"
                    />
                    <ScoreBox
                        label="Overlap Score Average"
                        value={formatPercent(report.avg_score)}
                        color="text-yellow-600"
                    />
                    <button 
                        type="button"
                        onClick={() => onDelete(report.id)}
                        aria-label="{`Delete report ${report.id}`}"
                        className="flex w-28 cursor-pointer items-center justify-center rounded-[1.25rem] border border-white/40 bg-red-400/80 text-black shadow-md backdrop-blur-md transition-all duration-300 hover:scale-[1.03] hover:bg-red-500 active:scale-[0.97]"
                    >
                        <Trash2 size={42}/>
                    </button>
                </div>
            </div>

            <div className="mt-8 grid gap-4 text-xl text-blue-950 md:grid-cols-3">
                <p>Vessels: {report.vessel_count}</p>
                <p>
                    SST: {" "}
                    {report.sea_surface_temp === null
                        ? "N/A"
                        : `${report.sea_surface_temp}°C`}
                </p>
                <p>BBox: {report.bbox.join(", ")}</p>
            </div>

            <div className="my-10 h-1 rounded-full bg-sky-200/70" />

            <div className="grid gap-6 font-cal text-2xl text-blue-950 md:grid-cols-4">
                <p>Vessel Name</p>
                <p>MMSI</p>
                <p>Status</p>
                <p>Overlap Score</p>
            </div>

            <div className="mt-5 flex max-h-80 flex-col gap-4 overflow-y-scroll pr-2">
                {vessels.map((vessel) => (
                    <div
                        key={`${report.id}-${vessel.mmsi}`}
                        className="grid gap-6 text-xl text-blue-950 md:grid-cols-4"
                    >
                        <p>{vessel.vessel_name}</p>
                        <p>{vessel.mmsi}</p>
                        <p className={getRiskColor(vessel.level)}>{vessel.level}</p>
                        <p>{formatPercent(vessel.score)}</p>
                    </div>
                ))}
            </div>

            {vessels.length > 5 && (
                    <p className="mt-4 text-sm text-blue-950/70">
                        Scroll to view all vessels
                    </p>
                )}
        </section>
    );
}