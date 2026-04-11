import { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { authService } from "../services/api";
import listings from "../data/listings";

// ✅ Icons
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Redirect back or home
  const from = location.state?.from?.pathname || "/";

  // ✅ Background image
  const bgImage = listings[0].images[0];

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authService.login(email, password);
      
      // Store token
      localStorage.setItem("token", response.access_token);
      
      // Update user context
      setUser({ email });

      // ✅ Redirect correctly
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-full bg-cover bg-center relative flex items-center justify-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Layout */}
      <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row items-center justify-between px-6">

        {/* LEFT TEXT */}
        <div className="text-white max-w-lg mb-10 md:mb-0">
          <h1 className="text-5xl font-serif font-bold mb-4">
            Afri<span className="text-[#C4622D]">Stay</span>
          </h1>

          <p className="text-lg leading-relaxed">
            Discover Africa’s most breathtaking stays — from safari lodges to
            coastal escapes. Your journey starts here.
          </p>
        </div>

        {/* LOGIN CARD */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl">

          <h2 className="text-2xl font-semibold mb-6 text-[#3D2B1A]">
            Login
          </h2>

          {/* GOOGLE */}
          <button className="w-full flex items-center justify-center gap-3 border py-2 rounded-lg mb-4 hover:bg-gray-50">
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>

          <div className="text-center text-sm text-gray-400 mb-4">or</div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* EMAIL */}
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full border p-3 mb-3 rounded-lg focus:ring-2 focus:ring-[#C4622D]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />

          {/* PASSWORD */}
          <div className="relative mb-2">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#C4622D]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />

            <button
              type="button"
              className="absolute right-3 top-3 text-gray-500"
              onClick={() => setShowPassword(!showPassword)}
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* FORGOT */}
          <div className="text-right mb-4">
            <Link
              to="/forgot-password"
              className="text-sm text-[#C4622D] hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* LOGIN BUTTON */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-[#C4622D] text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* REGISTER */}
          <p className="text-sm text-center mt-6 text-gray-600">
            Don’t have an account?{" "}
            <Link
              to="/register"
              className="text-[#C4622D] font-medium hover:underline"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}