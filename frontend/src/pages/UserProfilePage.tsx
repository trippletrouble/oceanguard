import Header from "../components/Header";
import SectionHeader from "../components/UserProfile/SectionHeader";
import ReportPanel, {
  type UserReport,
} from "../components/UserProfile/ReportPanel";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchReports, deleteReport } from "../services/api";

export default function UserProfilePage() {
  const navigate = useNavigate();

  const { user, token, loading } = useAuth();

  const username =
    user?.displayName || user?.email?.split("@")[0] || "Username";

  const queryClient = useQueryClient();

  const deleteReportMutation = useMutation({
    mutationFn: (reportId: number) => deleteReport(token!, reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });

  const handleDeleteReport = (reportId: number) => {
    deleteReportMutation.mutate(reportId);
  };

  const { data: reports = [], isLoading } = useQuery<UserReport[]>({
    queryKey: ["reports"],
    queryFn: () => fetchReports(token!),
    enabled: !!token && !loading,
  });

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Failed to log out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-ocean px-6 pb-16 pt-32 font-cal md:px-14">
      <Header />

      <main className="mx-auto flex md:max-w-[75%] flex-col gap-14">
        <section className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-cal text-xl uppercase">User</p>
            <h1 className="mt-4 font-righteous text-6xl md:text-8xl">
              {username}
            </h1>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="cursor-pointer flex w-fit items-center gap-5 rounded-[1.25rem] bg-red-400 px-12 py-5 font-medium text-3xl text-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            <LogOut size={34} />
            Logout
          </button>
        </section>

        <SectionHeader />

        {isLoading ? (
          <p className="text-2xl text-white">Loading reports...</p>
        ) : reports.length === 0 ? (
          <section className="rounded-[2em] border border-white/40 bg-white/15 px-8 py-10 shadow-lg backdrop-blur-md md:px-12">
            <h3 className="font-cal text-5xl md:text-6xl">No reports yet</h3>
            <p className="mt-4 text-2xl text-slate-700">
              Add a fish from the map to generate your first report.
            </p>
          </section>
        ) : (
          reports.map((report) => (
            <ReportPanel
              key={report.id}
              report={report}
              onDelete={handleDeleteReport}
            />
          ))
        )}
      </main>
    </div>
  );
}
