export default function LandingInfoBox() {
  return (
    <section className="w-full flex justify-center">
      <div className="glass-card rounded-4xl flex flex-col w-[75%] gap-8 p-12">
        <h3 className="text-4xl max-w-xl text-white font-cal">
          Ocean Guard integrates 3 APIs to transform data into knowledge
        </h3>

        <div className="flex flex-wrap items-center gap-12 my-2 z-10">
          <img
            src="/obis-logo.png"
            alt="OBIS Logo"
            className="h-14 w-auto object-contain select-none pointer-events-none"
          />
          <img
            src="/aisstream-logo.png"
            alt="aisstream.io Logo"
            className="h-10 w-auto object-contain select-none pointer-events-none"
          />
          <img
            src="/open-meteo-logo.png"
            alt="OpenMeteo Logo"
            className="h-14 w-auto object-contain select-none pointer-events-none"
          />
        </div>

        <p className="text-2xl max-w-md text-white font-cal leading-relaxed z-10">
          OceanGuard integrates these global data sources to calculate real-time
          threat levels, identifying high-risk fishing activity the moment it
          enters protected waters.
        </p>

        <div className="absolute bottom-0 right-0 w-1/2 h-[85%] rounded-br-4xl overflow-hidden pointer-events-none z-0">
          <img
            src="/globe.png"
            alt="Decorative Globe Blueprint"
            className="absolute -bottom-12 -right-12 h-full w-auto object-contain pointer-events-none select-none opacity-85"
            style={{
              transform: "translate(10%, 15%) rotate(-75deg)",
              filter: "drop-shadow(5px -10px 50px rgba(0, 0, 0, 0.2))",
            }}
          />
        </div>
      </div>
    </section>
  );
}
