import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { auth } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { syncUser } from "../services/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // Sync user with backend
      await syncUser(token, email.split("@")[0]);


      // again we redirect just to see some changes after is a succesfull login
      navigate("/map");
    } catch (err: any) {
      setError(err.message || "Failed to log in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex font-cal">
      {/* Photo Section */}
      <div 
        className="hidden md:block w-1/2 h-full bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1543007182-a56afb01d56f?q=80&w=1469&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")' }}
      >
      </div>

      {/* Form Section (maybe we should avoid long classnames creating some classes for texts and inputs, but this works)*/}
      <div className="bg-white w-full md:w-1/2 h-full flex flex-col justify-center px-8 md:px-24">
        <div className="w-full max-w-md mx-auto">
          <h1 className="font-righteous text-5xl text-blue-600 mb-10">Login</h1>

          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-8" action={handleLogin}>
            <div>
              <label className="block text-blue-900/80 text-lg mb-2">Email</label>
              <input 
                name="email"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white border-2 border-blue-100 rounded-2xl px-5 py-4 text-black focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg"
                placeholder="name@example.com"
                required
              />
            </div>
            <div>
              <label className="block text-blue-900/80 text-lg mb-2">Password</label>
              <input 
                name="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white border-2 border-blue-100 rounded-2xl px-5 py-4 text-black focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-lg"
                placeholder="••••••••"
                required
              />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-righteous text-xl py-4 rounded-2xl transition-all shadow-xl hover:shadow-blue-500/20 mt-6 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <p className="mt-10 text-slate-500 text-center text-lg">
            Don't have an account?{" "}
            <Link to="/register" className="text-blue-600 hover:underline font-bold">
              Register now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
