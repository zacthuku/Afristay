import { useState, useContext, useEffect, useCallback } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { authService, userService } from "../services/api";


// ✅ Icons
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser, listings } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Redirect back or home
  const from = location.state?.from?.pathname || "/";

  // ✅ Background image
  const bgImage = listings[0]?.images?.[0] || "https://images.unsplash.com/photo-1501785888041-af3ef285b470";

  const handleGoogleLogin = useCallback(async (response) => {
    try {
      const res = await authService.googleAuth(response.credential);
      localStorage.setItem("token", res.access_token);
      const userData = await userService.getCurrentUser();
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setSuccess(res.message || "Google login successful!");

      const defaultDestination =
        userData.role === "admin"
          ? "/admin/users"
          : userData.role === "host"
          ? "/host/dashboard"
          : "/";
      const redirectTo =
        from && !["/login", "/register"].includes(from) ? from : defaultDestination;

      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Google login failed");
    }
  }, [navigate, setUser, from]);

  // Initialize Google Sign-In
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (!window.google) {
        console.warn("⚠️ Google Sign-In library not loaded, retrying...");
        setTimeout(initializeGoogleSignIn, 100);
        return;
      }

      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "YOUR_CLIENT_ID";
      if (clientId === "YOUR_CLIENT_ID") {
        console.warn("⚠️ Google Client ID not configured. Set VITE_GOOGLE_CLIENT_ID in .env.local");
        return;
      }

      try {
        if (!window.google._gsi_initialized) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleLogin,
          });
          window.google._gsi_initialized = true;
        }

        const element = document.getElementById("google-signin");
        if (element) {
          window.google.accounts.id.renderButton(element, { theme: "outline", size: "large" });
        }
      } catch (error) {
        console.error("❌ Google Sign-In initialization failed:", error);
      }
    };

    initializeGoogleSignIn();
  }, [handleGoogleLogin]);

  const handleLogin = async () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = true;
    if (!password) newErrors.password = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await authService.login(email, password);
      localStorage.setItem("token", response.access_token);
      const userData = await userService.getCurrentUser();
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      setSuccess(response.message || "Login successful!");

      const defaultDestination =
        userData.role === "admin"
          ? "/admin/users"
          : userData.role === "host"
          ? "/host/dashboard"
          : "/";
      const redirectTo =
        from && !["/login", "/register"].includes(from) ? from : defaultDestination;

      setTimeout(() => {
        navigate(redirectTo, { replace: true });
      }, 1500);
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
          <div id="google-signin" className="mb-4"></div>

          <div className="text-center text-sm text-gray-400 mb-4">or</div>

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg mb-4">
              {success}
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4">
              {error}
            </div>
          )}

          {/* EMAIL */}
          <div className="mb-3">
            <input
              type="email"
              placeholder="Enter your email"
              className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#C4622D] ${errors.email ? "border-red-400 bg-red-50" : ""}`}
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: false })); }}
              disabled={loading}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">Email is required.</p>}
          </div>

          {/* PASSWORD */}
          <div className="relative mb-2">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              className={`w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#C4622D] ${errors.password ? "border-red-400 bg-red-50" : ""}`}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: false })); }}
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

          {errors.password && <p className="text-red-500 text-xs mt-1 mb-1">Password is required.</p>}

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