import { useState, useContext } from "react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { setUser } = useContext(AppContext);
  const navigate = useNavigate();

  const handleLogin = () => {
    setUser({ email }); // mock auth
    navigate("/");
  };

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="w-96 border p-6 rounded-xl">
        <h2 className="text-2xl mb-4">Login</h2>
        <input
          className="w-full border p-2 mb-3"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          className="w-full border p-2 mb-3"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          onClick={handleLogin}
          className="w-full bg-clay text-white py-2 rounded-lg"
        >
          Login
        </button>
      </div>
    </div>
  );
}