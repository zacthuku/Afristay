import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { authService } from "../services/api";
import { validateEmail } from "../utils/validate";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { listings } = useContext(AppContext);

  const bgImage = listings[1]?.images?.[0] || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";

  const handleReset = async () => {
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    setEmailError(null);
    setError("");
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
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

        {sent ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-[#3D2B1A] mb-2">Check your email</h2>
            <p className="text-sm text-gray-600 mb-6">
              If <strong>{email}</strong> is registered, we've sent a password reset link. It expires in 1 hour.
            </p>
            <Link to="/login" className="text-sm text-[#C4622D] hover:underline">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-2xl font-semibold mb-2 text-[#3D2B1A]">Forgot Password</h2>
            <p className="text-sm text-gray-500 mb-6">
              Enter your email and we'll send you a reset link.
            </p>

            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                {error}
              </div>
            )}

            <div className="mb-4">
              <input
                type="email"
                placeholder="Enter your email"
                className={`w-full border p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C4622D] ${emailError ? "border-red-400 bg-red-50" : ""}`}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(null); setError(""); }}
                disabled={loading}
              />
              {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
            </div>

            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-[#C4622D] text-white py-3 rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
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
