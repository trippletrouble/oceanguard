import Header from "@/components/Header";
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';


export default function AboutPage() {
    return (
        <>
        <Header />
        <main className="w-full flex flex-col gap-12 overflow-x-hidden pt-48">
            <h1>About Us</h1>
            <p>Welcome to our about page!</p>

            <ul>
                <li><a href="#mission">Our Mission</a></li>
                <li><a href="#apis">Used APIs</a></li>
                <li><a href="#explanation">Our Method</a></li>
                <li><a href="#team">Our Team</a></li>
                <li><a href="#contact">Contact Us</a></li>
            </ul>

            <section id="mission">
                <h2>Our Mission</h2>
                <p>
                    We aim to to protect fish populations during their migration routes through data-driven solutions. 
                    Using our intuitive map, users will be shown real life data about possible vessels that can provide a threat to a certain area.
                    Ilegal fishing is a major threat and difficult to track, but with data we can approximate which vessels are likely to be fishing
                    ilegally in migration zones.
                </p>

            </section>

            <section id="apis">
                <h2>Used APIs</h2>
                <p>We use 3 different APIs to gather and analyze historical species sightings, current temperatures and live ship positions.</p>

                <h3>OBIS API</h3>
                <p>
                    From Ocean Biodiversity Information System we gather different sightings during time.
                    Creating different seasonal distribution zones, that will be contrasted with current temperature data
                    to determine if the zone is a current migration zone or not.
                </p>
                <h3>OpenMeteo Marine API</h3>
                <p>
                    From OpenMeteo Marine we gather current temperature data and weather forecasts for the ocean.
                    This information is crucial for understanding the environmental conditions that influence fish migration patterns.
                </p>
                <h3>AISstream websocket API</h3>
                <p>
                    From AISstream we obtain live vessel position and information. With this information we can determine a vessel speed,
                    and with this approximate if the vessel is in transit or likely fishing.
                </p>
            </section>
            
            <section id="explanation">
                <h2>Our Method</h2>
                <p>
                    We use an Overlap Score to determine if a vessel is likely fishing illegally in a migration zone.
                    The score uses the next formula:
                </p>

                <BlockMath math="Score = D \times (A \times 0.6 + T \times 0.4)" />

                <table>
                    <thead>
                        <tr>
                            <th>Variable</th>
                            <th>Formula</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>D</td>
                            <td><InlineMath math="\max\left(0,\; 1 - \frac{distance}{100}\right)" /></td>
                            <td>
                                Distance factor from the vessel to the migration zone. 
                                Within 100 kilometers, the closer the vessel is to the zone, the higher the score.
                            </td>
                        </tr>
                        <tr>
                            <td>A</td>
                            <td><InlineMath math="\max\left(0,\; 1 - \frac{speed}{10}\right)" /></td>
                            <td>Activity factor of the vessel. The slower the vessel goes, the higher the score.</td>
                        </tr>
                        <tr>
                            <td>T</td>
                            <td><InlineMath math="\max\left(0,\; 1 - \frac{|T_{now} - T_{preferred}|}{R}\right)" /></td>
                            <td>Temperature factor.The closer the actual temperature is to the preferred temperature for a specific fish species, the higher the score.</td>
                        </tr>
                    </tbody>
                </table>
                <p>* distance is calculated using the haversine formula.</p>
            </section>

            <section id="team">
                <h2>Our Team</h2>
                <p>
                    We are a diverse team of software engineers and marine enthusiasts ready to contribute to ocean conservation efforts.
                    5 students from the University of Hof, Computer Science program. We put our knowledge of data and APIs to good use,
                    creating an useful tool to help the world.
                </p>
            </section>
            <section id="contact">
                <h2>Contact Us</h2>
                <p>If you have any questions or would like to get involved, please reach out to us at contact@oceanguard.org</p>
            </section>
        </main>
        </>
    )
}