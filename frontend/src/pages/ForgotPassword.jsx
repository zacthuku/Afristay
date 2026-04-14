import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";


export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const { listings } = useContext(AppContext);

  const bgImage = listings[1]?.images?.[0] || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e";

  const handleReset = () => {
    toast.success("Password reset link sent to " + email + ". Please check your email.");
  };

  return (
    <div
      className="h-screen w-full bg-cover bg-center relative flex items-center justify-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 w-full max-w-md bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl">

        <h2 className="text-2xl font-semibold mb-4">
          Forgot Password
        </h2>

        <p className="text-sm text-gray-500 mb-6">
          Enter your email and we’ll send you a reset link.
        </p>

        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border p-3 mb-4 rounded-lg focus:ring-2 focus:ring-[#C4622D]"
          onChange={(e) => setEmail(e.target.value)}
        />

        <button
          onClick={handleReset}
          className="w-full bg-[#C4622D] text-white py-3 rounded-lg"
        >
          Send Reset Link
        </button>

        <Link to="/login" className="block text-center mt-4 text-sm text-[#C4622D]">
          Back to Login
        </Link>
      </div>
    </div>
  );
}