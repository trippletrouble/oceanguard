import Header from "@/components/Header";
import { Fishes } from "../components/Fishes";

export default function LandingPage() {
  return (
    <>
      <Header />
      <div className="pt-32">
        <Fishes />
      </div>
    </>
  );
}
