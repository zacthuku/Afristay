import { useState } from "react";
import { useNavigate } from "react-router-dom";
import listings from "../data/listings";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();

  // 🔥 Step control
  const [step, setStep] = useState(1);

  // 🔥 Form state
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 🔥 UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // 🔥 Mock code (simulate backend)
  const [generatedCode, setGeneratedCode] = useState("");

  const bgImage = listings[1].images[0];

  // STEP 1 → Send Code
  const handleSendCode = () => {
    if (!email) return alert("Enter your email");

    // 🔥 simulate registered user check
    const isRegistered = true;

    if (!isRegistered) {
      alert("Email not found");
      return;
    }

    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(mockCode);

    alert(`Reset code sent to ${email} (Mock: ${mockCode})`);

    setStep(2);
  };

  // STEP 2 → Reset Password
  const handleReset = () => {
    if (!code || !password || !confirmPassword) {
      return alert("Fill all fields");
    }

    if (code !== generatedCode) {
      return alert("Invalid reset code");
    }

    if (password !== confirmPassword) {
      return alert("Passwords do not match");
    }

    alert("Password successfully reset!");

    navigate("/", { replace: true });
  };

  return (
    <div
      className="h-screen w-full bg-cover bg-center relative flex items-center justify-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 w-full max-w-6xl flex flex-col md:flex-row items-center justify-between px-6">

        {/* LEFT */}
        <div className="text-white max-w-lg mb-10 md:mb-0">
          <h1 className="text-5xl font-serif font-bold mb-4">
            Afri<span className="text-[#C4622D]">Stay</span>
          </h1>
          <p className="text-lg">
            Secure your account and get back to exploring Africa.
          </p>
        </div>

        {/* CARD */}
        <div className="w-full max-w-md bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl">

          {/* STEP 1 */}
          {step === 1 && (
            <>
              <h2 className="text-2xl font-semibold mb-4">
                Reset Password
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Enter your email to receive a reset code.
              </p>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full border p-3 mb-4 rounded-lg"
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                onClick={handleSendCode}
                className="w-full bg-[#C4622D] text-white py-3 rounded-lg"
              >
                Send Reset Code
              </button>
            </>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <>
              <h2 className="text-2xl font-semibold mb-4">
                Verify Code
              </h2>

              <p className="text-sm text-gray-500 mb-6">
                Enter the code sent to your email and set a new password.
              </p>

              {/* CODE */}
              <input
                type="text"
                placeholder="Enter reset code"
                className="w-full border p-3 mb-3 rounded-lg"
                onChange={(e) => setCode(e.target.value)}
              />

              {/* PASSWORD */}
              <div className="relative mb-3">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  className="w-full border p-3 rounded-lg"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* CONFIRM */}
              <div className="relative mb-4">
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm password"
                  className="w-full border p-3 rounded-lg"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-500"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <button
                onClick={handleReset}
                className="w-full bg-[#C4622D] text-white py-3 rounded-lg"
              >
                Reset Password
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}