import { useState, useContext } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { authService } from "../services/api";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const { listings } = useContext(AppContext);
  const navigate = useNavigate();

  const bgImage = listings[0]?.images?.[0] || "https://images.unsplash.com/photo-1501785888041-af3ef285b470";

  const handleSubmit = async () => {
    const newErrors = {};
    if (!password) newErrors.password = true;
    if (!confirmPassword) newErrors.confirmPassword = true;
    if (password && confirmPassword && password !== confirmPassword) newErrors.mismatch = true;
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.message || "Failed to reset password. The link may have expired.");
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

      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl">

        {!token ? (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-[#3D2B1A] mb-3">Invalid Reset Link</h2>
            <p className="text-sm text-gray-600 mb-4">
              This reset link is invalid or missing a token. Please request a new one.
            </p>
            <Link to="/forgot-password" className="text-[#C4622D] text-sm hover:underline">
              Request Password Reset
            </Link>
          </div>
        ) : done ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#3D2B1A] mb-2">Password Updated!</h2>
            <p className="text-sm text-gray-600 mb-4">
              Your password has been changed. Redirecting to login...
            </p>
            <Link to="/login" className="text-[#C4622D] text-sm hover:underline">
              Go to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-2 text-[#3D2B1A]">Set New Password</h2>
            <p className="text-sm text-gray-500 mb-6">
              Choose a strong password for your account.
            </p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-3">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: false, mismatch: false })); setError(""); }}
                  disabled={loading}
                  className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4622D] ${errors.password ? "border-red-400 bg-red-50" : ""}`}
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
              {errors.password && <p className="text-red-500 text-xs mt-1">Password is required.</p>}
            </div>

            <div className="mb-5">
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrors((p) => ({ ...p, confirmPassword: false, mismatch: false })); setError(""); }}
                  disabled={loading}
                  className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4622D] ${errors.confirmPassword || errors.mismatch ? "border-red-400 bg-red-50" : ""}`}
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
              {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">Please confirm your password.</p>}
              {errors.mismatch && <p className="text-red-500 text-xs mt-1">Passwords do not match.</p>}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#C4622D] text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>

            <Link to="/login" className="block text-center mt-4 text-sm text-[#C4622D] hover:underline">
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
