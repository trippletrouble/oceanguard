export default function LandingInfoBox() {
  return (
    <section className="w-full flex justify-center">
      <div className="glass-card rounded-3xl md:rounded-4xl flex flex-col w-full lg:w-[75%] gap-6 md:gap-8 p-6 md:p-12">
        <h3 className="text-3xl md:text-4xl max-w-xl text-white font-cal leading-tight">
          Ocean Guard integrates 3 APIs to transform data into knowledge
        </h3>

        <div className="flex flex-wrap items-center gap-6 md:gap-12 my-2 z-10">
          <img
            src="/obis-logo.png"
            alt="OBIS Logo"
            className="h-10 md:h-14 w-auto object-contain select-none pointer-events-none"
          />
          <img
            src="/aisstream-logo.png"
            alt="aisstream.io Logo"
            className="h-7 md:h-10 w-auto object-contain select-none pointer-events-none"
          />
          <img
            src="/open-meteo-logo.png"
            alt="OpenMeteo Logo"
            className="h-10 md:h-14 w-auto object-contain select-none pointer-events-none"
          />
        </div>

        <p className="text-lg md:text-2xl max-w-md text-white font-cal leading-relaxed z-10 pb-28 md:pb-0">
          OceanGuard integrates these global data sources to calculate real-time
          threat levels, identifying high-risk fishing activity the moment it
          enters protected waters.
        </p>

        <div className="absolute bottom-0 left-0 md:left-auto right-0 w-full md:w-1/2 h-[85%] rounded-b-3xl md:rounded-b-none md:rounded-br-4xl overflow-hidden pointer-events-none z-0">
          <img
            src="/globe.png"
            alt="Decorative Globe Blueprint"
            className="absolute -bottom-75 md:-bottom-12 left-1/2 md:left-auto md:-right-12 h-full w-auto object-contain pointer-events-none select-none opacity-85 -translate-x-1/2 md:translate-x-[10%] md:translate-y-[15%] rotate-[-75deg] transition-transform"
            style={{
              filter: "drop-shadow(5px -10px 50px rgba(0, 0, 0, 0.2))",
            }}
          />
        </div>
      </div>
    </section>
  );
}
