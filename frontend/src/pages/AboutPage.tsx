import Header from "@/components/Header";
import Section from "@/components/AboutPage/Section";
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';


export default function AboutPage() {
    return (
        <>
        <Header />
        <main className="w-full flex flex-col gap-12 overflow-x-hidden pt-48">
            
            <Section id="introduction" title="Jump to :">
                <ul>
                <li><a href="#mission" className="inline-block hover:text-blue-800 hover:scale-105 transition-all duration-200">Our Mission</a></li>
                <li><a href="#apis" className="inline-block hover:text-blue-800 hover:scale-105 transition-all duration-200">Used APIs</a></li>
                <li><a href="#explanation" className="inline-block hover:text-blue-800 hover:scale-105 transition-all duration-200">Our Method</a></li>
                <li><a href="#team" className="inline-block hover:text-blue-800 hover:scale-105 transition-all duration-200">Our Team</a></li>
                <li><a href="#contact" className="inline-block hover:text-blue-800 hover:scale-105 transition-all duration-200">Contact Us</a></li>
            </ul>
            </Section>

            <Section id="mission" title="Our Mission">
                <p>
                    We aim to protect fish populations during their migration routes through data-driven solutions.
                    Using our intuitive map, users will be shown real life data about possible vessels that can pose a threat to a certain area.
                    Illegal fishing is a major threat and difficult to track, but with data we can approximate which vessels are likely to be fishing
                    illegally in migration zones.
                </p>
            </Section>

            <Section id="apis" title="Used APIs">

                <div className="mb-12">
                    <img src="/obis-logo.png" alt="OBIS API Logo" className="h-20 w-auto object-contain mb-2" />
                    <p>
                        From Ocean Biodiversity Information System API we gather different sightings over time.
                        Creating different seasonal distribution zones, that will be contrasted with current temperature data
                        to determine if the zone is a current migration zone or not.
                    </p>
                </div>
                
                <div className="mb-12">
                    <img src="/open-meteo-logo.png" alt="Open-Meteo Marine API Logo" className="h-28 w-auto object-contain mb-2" />
                    <p>
                        From OpenMeteo Marine API we gather current temperature data and weather forecasts for the ocean.
                        This information is crucial for understanding the environmental conditions that influence fish migration patterns.
                    </p>
                </div>

                <div className="mb-12">
                    <img src="/aisstream-logo.png" alt="AISstream API Logo" className="h-20 w-auto object-contain mb-2" />
                    <p>
                        From AISstream websocket API we obtain live vessel position and information. With this information we can determine a vessel speed,
                        and with this approximate if the vessel is in transit or likely fishing.
                    </p>
                </div>
            </Section>
            
            <Section id="explanation" title="Our Method">
                <p>
                    We use an Overlap Score to determine if a vessel is likely fishing illegally in a migration zone.
                    The score uses the next formula:
                </p>

                <BlockMath math="Score = D \times (A \times 0.6 + T \times 0.4)" />

                <table className="border-collapse">
                    <thead>
                        <tr>
                            <th className="border border-gray-300 px-6 py-3">Variable</th>
                            <th className="border border-gray-300 px-6 py-3">Formula</th>
                            <th className="border border-gray-300 px-6 py-3">Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td className="border border-gray-300 px-6 py-3 text-center" >D</td>
                            <td className="border border-gray-300 px-6 py-3"><InlineMath math="\max\left(0,\; 1 - \frac{distance}{100}\right)" /></td>
                            <td className="border border-gray-300 px-6 py-3">
                                Distance factor from the vessel to the migration zone. 
                                Within 100 kilometers, the closer the vessel is to the zone, the higher the score.
                            </td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-6 py-3 text-center" >A</td>
                            <td className="border border-gray-300 px-6 py-3"><InlineMath math="\max\left(0,\; 1 - \frac{speed}{10}\right)" /></td>
                            <td className="border border-gray-300 px-6 py-3">Activity factor of the vessel. The slower the vessel goes, the higher the score.</td>
                        </tr>
                        <tr>
                            <td className="border border-gray-300 px-6 py-3 text-center" >T</td>
                            <td className="border border-gray-300 px-6 py-3"><InlineMath math="\max\left(0,\; 1 - \frac{|T_{now} - T_{preferred}|}{R}\right)" /></td>
                            <td className="border border-gray-300 px-6 py-3">Temperature factor. The closer the actual temperature is to the preferred temperature for a specific fish species, the higher the score.</td>
                        </tr>
                    </tbody>
                </table>
                <p className="text-sm mt-2">
                    * distance is calculated using the haversine formula.
                </p>
            </Section>

            <Section id="team" title="Our Team">
                <p>
                    We are a diverse team of software engineers and marine enthusiasts ready to contribute to ocean conservation efforts.
                    5 students from the University of Hof, Computer Science program. We put our knowledge of data and APIs to good use,
                    creating a useful tool to help the world.
                </p>
            </Section>

            <Section id="contact" title="Contact Us">
                <p>If you have any questions or would like to get involved, please reach out to us at contact@oceanguard.org</p>
            </Section>

            <div className="h-10"></div>
        </main>
        </>
    )
}