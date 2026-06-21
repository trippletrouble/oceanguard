import Header from "../components/Header";
import SectionHeader from "../components/UserProfile/SectionHeader"
import ReportPanel from "../components/UserProfile/ReportPanel"
import { LogOut } from "lucide-react"

export default function UserProfilePage() {
  return (
    <div className="min-h-screen bg-ocean px-6 pb-16 pt-32 font-cal md:px-14">
      <Header />

      <main className="mx-auto flex max-w-7xl flex-col gap-14">
        <section className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <div>
                <p className="font-cal text-xl uppercase text-black">User</p>
                <h1 className="mt-4 font-righteous text-6xl text-black md:text-8xl">Username</h1>
            </div>

            <button
                type="button"
                onClick={() => (window.location.href = "/login")}
                className="cursor-pointer flex w-fit items-center gap-5 rounded-[1.25rem] bg-red-400 px-12 py-5 font-medium text-3xl text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
            >
                <LogOut size={34} />
                Logout
            </button>
        </section>

        <SectionHeader />

        <ReportPanel
          fishName="Sardine"
          scientificName="scientific name"
          maxScore="92%"
          avgScore="48%"  
        />

        <ReportPanel
          fishName="Other Fish"
          scientificName="scientific name"
          maxScore="--"
          avgScore="--"
        />
      </main>
    </div>
  );
}
