import Section from "@/components/AboutPage/Section";
import AnimatedText from "@/components/AboutPage/AnimatedText";
import { BlockMath, InlineMath } from "react-katex";
import "katex/dist/katex.min.css";

export default function AboutPage() {
  const jumpLinks = [
    { href: "#mission", label: "Our Mission" },
    { href: "#apis", label: "Used APIs" },
    { href: "#explanation", label: "Our Method" },
    { href: "#team", label: "Our Team" },
    { href: "#contact", label: "Contact Us" },
  ];

  return (
    <>
      <main className="w-full flex flex-col gap-24 overflow-x-hidden pb-32">
        <section className="w-full max-w-5xl mx-auto pt-48 px-4 md:px-0">
          <div className="w-full flex flex-col items-center">
            <div className="w-full glass-card p-4 min-h-fit! rounded-4xl flex flex-wrap items-center justify-center">
              {jumpLinks.map((link, idx) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="group flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold text-slate-600 hover:text-[#003a95] hover:bg-white/90 transition-all duration-300 font-cal relative"
                >
                  <span className="text-[10px] font-righteous text-slate-400 group-hover:text-[#003a95]/70 transition-colors duration-300">
                    0{idx + 1}
                  </span>
                  <span>{link.label}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <Section id="mission" title="Our Mission">
          <AnimatedText>
            We aim to protect fish populations during their migration routes
            through data-driven solutions. Using our intuitive map, users will
            be shown real life data about possible vessels that can pose a
            threat to a certain area. Illegal fishing is a major threat and
            difficult to track, but with data we can approximate which vessels
            are likely to be fishing illegally in migration zones.
          </AnimatedText>
        </Section>

        <Section id="apis" title="Used APIs">
          <div className="flex flex-col gap-10 font-cal">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center group">
              <div className="md:col-span-1 bg-white/60 rounded-2xl p-4 h-24 flex items-center justify-center border border-white transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/obis-logo.png"
                  alt="OBIS API Logo"
                  className="h-12 w-auto object-contain logo-brand-tint"
                />
              </div>
              <div className="md:col-span-3 text-base md:text-lg text-slate-700 leading-relaxed">
                <AnimatedText>
                  From Ocean Biodiversity Information System API we gather
                  different sightings over time. Creating different seasonal
                  distribution zones, that will be contrasted with current
                  temperature data to determine if the zone is a current
                  migration zone or not.
                </AnimatedText>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center group">
              <div className="md:col-span-1 bg-white/60 rounded-2xl p-4 h-24 flex items-center justify-center border border-white transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/open-meteo-logo.png"
                  alt="Open-Meteo Marine API Logo"
                  className="h-14 w-auto object-contain logo-brand-tint"
                />
              </div>
              <div className="md:col-span-3 text-base md:text-lg text-slate-700 leading-relaxed">
                <AnimatedText>
                  From OpenMeteo Marine API we gather current temperature data
                  and weather forecasts for the ocean. This information is
                  crucial for understanding the environmental conditions that
                  influence fish migration patterns.
                </AnimatedText>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center group">
              <div className="md:col-span-1 bg-white/60 rounded-2xl p-4 h-24 flex items-center justify-center border border-white transition-transform duration-300 group-hover:scale-105">
                <img
                  src="/aisstream-logo.png"
                  alt="AISstream API Logo"
                  className="h-12 w-auto object-contain logo-brand-tint"
                />
              </div>
              <div className="md:col-span-3 text-base md:text-lg text-slate-700 leading-relaxed">
                <AnimatedText>
                  From AISstream websocket API we obtain live vessel position
                  and information. With this information we can determine a
                  vessel speed, and with this approximate if the vessel is in
                  transit or likely fishing.
                </AnimatedText>
              </div>
            </div>
          </div>
        </Section>

        <Section id="explanation" title="Our Method">
          <p className="mb-6 text-slate-700 font-cal">
            We use an Overlap Score to determine if a vessel is likely fishing
            illegally in a migration zone. The score uses the next formula:
          </p>

          <div className="my-6 bg-slate-950 text-white rounded-3xl p-6 flex justify-center items-center overflow-x-auto">
            <BlockMath math="Score = D \times (A \times 0.6 + T \times 0.4)" />
          </div>

          <div className="flex flex-col gap-4 mt-8 font-cal">
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 font-righteous text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
              <div className="col-span-2 text-center">Variable</div>
              <div className="col-span-4">Formula</div>
              <div className="col-span-6">Description</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4 bg-white/50 p-5 md:p-6 rounded-2xl border border-slate-200/60 items-center">
              <div className="col-span-1 md:col-span-2 text-left md:text-center font-righteous text-2xl text-[#003a95] font-bold">
                D
              </div>
              <div className="col-span-1 md:col-span-4 text-right md:text-left font-mono text-sm overflow-x-auto text-slate-700">
                <InlineMath math="\max\left(0,\; 1 - \frac{\text{distance}}{100}\right)" />
              </div>
              <div className="col-span-2 md:col-span-6 text-slate-600 text-sm md:text-base mt-2 md:mt-0 pt-2 md:pt-0 border-t border-slate-200 md:border-none">
                Distance factor from the vessel to the migration zone. Within
                100 kilometers, the closer the vessel is to the zone, the higher
                the score.
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4 bg-white/50 p-5 md:p-6 rounded-2xl border border-slate-200/60 items-center">
              <div className="col-span-1 md:col-span-2 text-left md:text-center font-righteous text-2xl text-[#003a95] font-bold">
                A
              </div>
              <div className="col-span-1 md:col-span-4 text-right md:text-left font-mono text-sm overflow-x-auto text-slate-700">
                <InlineMath math="\max\left(0,\; 1 - \frac{\text{speed}}{10}\right)" />
              </div>
              <div className="col-span-2 md:col-span-6 text-slate-600 text-sm md:text-base mt-2 md:mt-0 pt-2 md:pt-0 border-t border-slate-200 md:border-none">
                Activity factor of the vessel. The slower the vessel goes, the
                higher the score.
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-4 bg-white/50 p-5 md:p-6 rounded-2xl border border-slate-200/60 items-center">
              <div className="col-span-1 md:col-span-2 text-left md:text-center font-righteous text-2xl text-[#003a95] font-bold">
                T
              </div>
              <div className="col-span-1 md:col-span-4 text-right md:text-left font-mono text-sm overflow-x-auto text-slate-700">
                <InlineMath math="\max\left(0,\; 1 - \frac{|T_{\text{now}} - T_{\text{preferred}}|}{R}\right)" />
              </div>
              <div className="col-span-2 md:col-span-6 text-slate-600 text-sm md:text-base mt-2 md:mt-0 pt-2 md:pt-0 border-t border-slate-200 md:border-none">
                Temperature factor. The closer the actual temperature is to the
                preferred temperature for a specific fish species, the higher
                the score.
              </div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-4 italic">
            * distance is calculated using the haversine formula.
          </p>
        </Section>

        <Section id="team" title="Our Team">
          <AnimatedText>
            We are a diverse team of software engineers and marine enthusiasts
            ready to contribute to ocean conservation efforts. 5 students from
            the University of Hof, Computer Science program. We put our
            knowledge of data and APIs to good use, creating a useful tool to
            help the world.
          </AnimatedText>
        </Section>

        <Section id="contact" title="Contact Us">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 text-slate-600 font-cal">
            <div className="max-w-xl text-slate-600">
              <AnimatedText>
                If you have any questions or would like to get involved, please
                reach out to our main coordination channel.
              </AnimatedText>
            </div>
            <a
              href="mailto:contact@oceanguard.org"
              className="px-6 py-3.5 rounded-2xl bg-[#003a95] hover:bg-sky-600 text-white font-righteous uppercase text-sm tracking-wider transition-all duration-300 hover:scale-105 active:scale-95 shrink-0"
            >
              contact@oceanguard.org
            </a>
          </div>
        </Section>
      </main>
    </>
  );
}
