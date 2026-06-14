import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { auth, googleProvider } from "../services/firebase";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
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

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      const email = result.user.email || "";
      
      // Sync user with backend and bring to map for input, temporal maybe?
      await syncUser(token, email.split("@")[0]);

      navigate("/map");
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google.");
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

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-slate-500">Or continue with</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="mt-4 w-full bg-white hover:bg-slate-50 text-slate-700 font-medium text-lg py-4 rounded-2xl transition-all shadow-md border-2 border-slate-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>

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
