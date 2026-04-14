import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { userService, authService } from "../services/api";

export default function Profile() {
  const { user, setUser, logout } = useContext(AppContext);
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    currentPassword: "",
    password: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const payload = {};
    if (form.name && form.name !== user?.name) payload.name = form.name;
    if (form.phone !== user?.phone) payload.phone = form.phone;

    if (!payload.name && !payload.phone && !form.currentPassword) {
      toast.info("No changes were made to your profile.");
      return;
    }

    try {
      let updatedUser = user;
      if (payload.name || payload.phone) {
        const response = await userService.updateProfile(payload);
        updatedUser = {
          ...user,
          name: payload.name ?? user?.name,
          phone: payload.phone ?? user?.phone,
        };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        toast.success(response.message || "Your profile has been updated successfully.");
      }

      if (form.currentPassword && form.password) {
        await authService.changePassword({
          current_password: form.currentPassword,
          new_password: form.password,
        });
        toast.success("Your password has been changed successfully.");
        setForm((prev) => ({ ...prev, currentPassword: "", password: "" }));
      }

      setForm((prev) => ({
        ...prev,
        name: updatedUser.name || "",
        phone: updatedUser.phone || "",
      }));
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to update profile. Please check your information and try again.");
    }
  }

  if (!user) return <div className="p-10">Please login</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-serif mb-6 text-[#3D2B1A]">My Profile</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow-md border space-y-4">

        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Email</label>
          <input
            disabled
            value={form.email}
            className="w-full border px-4 py-2 rounded-lg bg-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="Enter your phone number"
            className="w-full border px-4 py-2 rounded-lg focus:ring-2 focus:ring-[#C4622D]"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Current Password</label>
          <input
            type="password"
            name="currentPassword"
            value={form.currentPassword}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">New Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            className="w-full border px-4 py-2 rounded-lg"
          />
        </div>

        <button className="bg-[#C4622D] text-white px-6 py-2 rounded-full">
          Update Profile
        </button>

      </form>
    </div>
  );
}