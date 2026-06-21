type ReportPanelProps = {
    fishName: string;
    scientificName: string;
    maxScore: string;
    avgScore: string;
};

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

export default function ReportPanel({ 
    fishName,
    scientificName,
    maxScore,
    avgScore,
 }: ReportPanelProps) {
    return (
        <section className="rounded-[2rem] border border-white/40 bg-white/15 px-8 py-10 shadow-lg backdrop-blur-md md:px-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
                <div>
                    <h3 className="font-cal text-5xl text-black md:text-6xl">
                        {fishName}
                    </h3>

                    <p className="mt-5 font-cal text-2xl text-black">
                        ({scientificName})
                    </p>
                </div>

                <div className="flex flex-col gap-5 lg:flex-row">
                    <ScoreBox
                        label="Overlap Score Max"
                        value={maxScore}
                        color="text-red-700"
                    />
                    <ScoreBox
                        label="Overlap Score Average"
                        value={avgScore}
                        color="text-yellow-600"
                    />
                </div>
            </div>

            <div className="my-10 h-1 rounded-full bg-sky-200/70" />

            <div className="grid gap-6 font-cal text2xl text-blue-950 md:grid-cols-4">
                <p>Vessel Name</p>
                <p>MMSI</p>
                <p>Status</p>
                <p>Overlap Score</p>
            </div>
        </section>
    );
}