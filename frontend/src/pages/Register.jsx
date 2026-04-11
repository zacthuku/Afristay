import { useState, useContext } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { authService } from "../services/api";
import listings from "../data/listings";

// 🔥 Icons
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { setUser } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";
  const bgImage = listings[2].images[0];

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill all fields");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await authService.register(email, password);
      
      // Store token
      localStorage.setItem("token", response.access_token);
      
      // Update user context
      setUser({ email });
      
      // Redirect
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="h-screen w-full bg-cover bg-center relative flex items-center justify-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row items-center justify-between px-6">

        {/* LEFT TEXT */}
        <div className="text-white max-w-lg mb-10 md:mb-0">
          <h1 className="text-5xl font-serif font-bold mb-4">
            Afri<span className="text-[#C4622D]">Stay</span>
          </h1>
          <p className="text-lg leading-relaxed">
            Join AfriStay and unlock unforgettable stays across Africa.
          </p>
        </div>

        {/* CARD */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl">

          <h2 className="text-2xl font-semibold mb-6 text-[#3D2B1A]">
            Create Account
          </h2>

          {/* GOOGLE BUTTON */}
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
          <div className="relative mb-3">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
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

          {/* CONFIRM PASSWORD */}
          <div className="relative mb-4">
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              className="w-full border p-3 rounded-lg focus:ring-2 focus:ring-[#C4622D]"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />

            <button
              type="button"
              className="absolute right-3 top-3 text-gray-500"
              onClick={() => setShowConfirm(!showConfirm)}
              disabled={loading}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* SUBMIT */}
          <button
            onClick={handleRegister}
            disabled={loading}
            className="w-full bg-[#C4622D] text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* LOGIN */}
          <p className="text-sm text-center mt-6 text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-[#C4622D] font-medium">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}