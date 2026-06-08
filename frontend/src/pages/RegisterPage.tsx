import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { auth } from "../services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { syncUser } from "../services/api";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checks = [
    { label: "At least 8 characters", met: password.length >= 8 },
    { label: "At least 1 number", met: /\d/.test(password) },
    { label: "At least 1 special character", met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    { label: "No spaces", met: password.length > 0 && !/\s/.test(password) },
  ];

  const handleRegister = async () => {
    if (!checks.every((c) => c.met)) return;

    setError("");
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // taking first part of the email as name for backend
      const name = email.split("@")[0];
      await syncUser(token, name);


      // for now we redirect to map (just to have some feedback)
      navigate("/map");
    } catch (err: any) {
      setError(err.message || "Failed to create an account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex font-cal">
      {/* Form Section */}
      <div className="bg-white w-full md:w-1/2 h-full flex flex-col justify-center px-8 md:px-24 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          <h1 className="font-righteous text-5xl text-blue-600 mb-10">Register</h1>
          
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-100">
              {error}
            </div>
          )}

          <form className="space-y-6" action={handleRegister}>
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
              
              <ul className="mt-4 space-y-2">
                {checks.map((check, index) => (
                  <li 
                    key={index} 
                    className={`flex items-center text-sm transition-colors ${
                      check.met ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    <span className={`mr-2 h-2 w-2 rounded-full ${check.met ? "bg-blue-600" : "bg-slate-300"}`} />
                    {check.label}
                  </li>
                ))}
              </ul>
            </div>
            <button 
              type="submit" 
              disabled={!checks.every(c => c.met) || loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-righteous text-xl py-4 rounded-2xl transition-all shadow-xl hover:shadow-blue-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? "Creating account..." : "Sign Up"}
            </button>
          </form>
          <p className="mt-10 text-slate-500 text-center text-lg">
            Already have an account?{" "}
            <Link to="/login" className="text-blue-600 hover:underline font-bold">
              Login now
            </Link>
          </p>
        </div>
      </div>

      {/* Photo Section */}
      <div 
        className="hidden md:block w-1/2 h-full bg-cover bg-center"
        style={{ backgroundImage: 'url("https://images.unsplash.com/photo-1577710943883-98eca3dd1b4e?q=80&w=927&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D")' }}
      >
      </div>
    </div>
  );
}
