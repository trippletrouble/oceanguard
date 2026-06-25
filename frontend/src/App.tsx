import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
} from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import MapPage from "./pages/MapPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import AboutPage from "./pages/AboutPage";
import Header from "@/components/Header";
import UserProfilePage from "./pages/UserProfilePage";
import AddFishPage from "./pages/AddFishPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "./context/AuthContext.tsx";

const queryClient = new QueryClient();

function PageLayoutWithHeader() {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="w-full min-h-screen">
            <main>
              <Routes>
                <Route element={<PageLayoutWithHeader />}>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/about" element={<AboutPage />} />
                </Route>
                <Route path="/map" element={<MapPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/user/:username" element={<UserProfilePage />} />
                <Route path="/add-fish" element={<AddFishPage />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}
