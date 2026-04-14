import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { userService } from "../services/api";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await userService.listUsers();
        setUsers(data);
      } catch (error) {
        toast.error(error.message || "Failed to load user list. Please refresh the page.");
      }
    }

    fetchUsers();
  }, []);

  async function handleBlock(userId, blocked) {
    setLoading(true);
    try {
      await userService.blockUser(userId, blocked);
      setUsers((prev) => prev.map((user) => user.id === userId ? { ...user, is_blocked: blocked } : user));
      toast.success(blocked ? "User has been blocked successfully." : "User has been unblocked successfully.");
    } catch (error) {
      toast.error(error.message || "Failed to update user status. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(userId) {
    const confirmed = window.confirm("Are you sure you want to permanently delete this user account? This action cannot be undone.");
    if (!confirmed) return;

    setLoading(true);
    try {
      await userService.deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user.id !== userId));
      toast.success("User account has been permanently deleted.");
    } catch (error) {
      toast.error(error.message || "Failed to delete user account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-serif mb-6 text-[#3D2B1A]">Admin - User Management</h1>

      <div className="overflow-x-auto bg-white rounded-xl shadow-md border">
        <table className="min-w-full table-auto">
          <thead className="bg-[#FAF6EF] text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Blocked</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="px-4 py-3">{item.name || "—"}</td>
                <td className="px-4 py-3">{item.email}</td>
                <td className="px-4 py-3">{item.role}</td>
                <td className="px-4 py-3">{item.is_blocked ? "Yes" : "No"}</td>
                <td className="px-4 py-3 space-x-2">
                  <button
                    disabled={loading}
                    onClick={() => handleBlock(item.id, !item.is_blocked)}
                    className="rounded-lg border px-3 py-2 text-sm hover:bg-gray-100"
                  >
                    {item.is_blocked ? "Unblock" : "Block"}
                  </button>
                  <button
                    disabled={loading}
                    onClick={() => handleDelete(item.id)}
                    className="rounded-lg border border-red-500 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}