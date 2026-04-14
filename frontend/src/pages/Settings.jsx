import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { userService } from "../services/api";

export default function Settings() {
  const { logout } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete your account? This action cannot be undone and all your data will be lost."
    );
    if (!confirmed) return;

    setLoading(true);

    try {
      const response = await userService.deleteAccount();
      toast.success(response.message || "Your account has been permanently deleted.");
      logout();
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete account. Please contact support if the issue persists.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-serif mb-6 text-[#3D2B1A]">Settings</h1>

      <div className="bg-white p-6 rounded-xl shadow-md border space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-600">Receive updates about your bookings</p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Marketing Emails</h3>
                <p className="text-sm text-gray-600">Receive promotional offers and updates</p>
              </div>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4">Privacy</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Profile Visibility</h3>
                <p className="text-sm text-gray-600">Make your profile visible to other users</p>
              </div>
              <input type="checkbox" className="toggle" defaultChecked />
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-semibold mb-4 text-red-600">Danger Zone</h2>
          <button
            disabled={loading}
            onClick={handleDeleteAccount}
            className="bg-red-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}