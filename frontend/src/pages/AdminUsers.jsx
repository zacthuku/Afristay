import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { userService } from "../services/api";

function fmt(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

const ROLE_STYLE = {
  admin:  "bg-red-100 text-red-700",
  host:   "bg-purple-100 text-purple-700",
  client: "bg-blue-100 text-blue-700",
  guest:  "bg-gray-100 text-gray-500",
};

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState("");
  const [roleFilter, setRole] = useState("all");
  const [acting, setActing]   = useState(null);

  useEffect(() => {
    userService.listUsers()
      .then((data) => { setUsers(data); setFiltered(data); })
      .catch((e) => toast.error(e.message || "Failed to load users."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let out = users;
    if (roleFilter !== "all") out = out.filter((u) => u.role === roleFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      out = out.filter((u) => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q));
    }
    setFiltered(out);
  }, [search, roleFilter, users]);

  async function handleBlock(userId, blocked) {
    setActing(userId);
    try {
      await userService.blockUser(userId, blocked);
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_blocked: blocked } : u));
      toast.success(blocked ? "User blocked." : "User unblocked.");
    } catch (e) {
      toast.error(e.message || "Failed to update user.");
    } finally {
      setActing(null);
    }
  }

  async function handleDelete(userId) {
    if (!window.confirm("Permanently delete this account? This cannot be undone.")) return;
    setActing(userId);
    try {
      await userService.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User deleted.");
    } catch (e) {
      toast.error(e.message || "Failed to delete.");
    } finally {
      setActing(null);
    }
  }

  const counts = {
    all:    users.length,
    admin:  users.filter((u) => u.role === "admin").length,
    host:   users.filter((u) => u.role === "host").length,
    client: users.filter((u) => u.role === "client").length,
  };

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3D2B1A]">User Management</h1>
            <p className="text-gray-500 mt-1">{users.length} total accounts</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-[#E8D9B8] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#C4622D]"
          />
          <div className="flex gap-2 flex-wrap">
            {["all", "admin", "host", "client"].map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${roleFilter === r ? "bg-[#C4622D] text-white" : "bg-white border border-[#E8D9B8] text-gray-600 hover:border-[#C4622D]"}`}
              >
                {r === "all" ? "All" : r} ({counts[r] ?? 0})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C4622D] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E8D9B8] p-12 text-center">
            <p className="text-gray-400">No users found.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#FAF6EF] border-b border-[#E8D9B8]">
                  <tr>
                    <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold">User</th>
                    <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold">Role</th>
                    <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold hidden md:table-cell">Phone</th>
                    <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold hidden lg:table-cell">Joined</th>
                    <th className="text-left px-5 py-3 text-[#3D2B1A] font-semibold hidden sm:table-cell">Status</th>
                    <th className="px-5 py-3 text-right text-[#3D2B1A] font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => (
                    <tr key={u.id} className={`border-b border-[#F0E8D8] last:border-0 hover:bg-[#FAF6EF] ${u.is_blocked ? "opacity-60" : ""}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#C4622D] text-white text-sm flex items-center justify-center font-bold flex-shrink-0">
                            {(u.name || u.email || "?").charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#3D2B1A] truncate">{u.name || "—"}</p>
                            <p className="text-xs text-gray-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${ROLE_STYLE[u.role] || "bg-gray-100 text-gray-500"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 hidden md:table-cell">{u.phone || "—"}</td>
                      <td className="px-5 py-3 text-gray-400 hidden lg:table-cell">{fmt(u.created_at)}</td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.is_blocked ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                          {u.is_blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {u.role !== "admin" && (
                            <button
                              disabled={acting === u.id}
                              onClick={() => handleBlock(u.id, !u.is_blocked)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors disabled:opacity-50 ${u.is_blocked ? "border-green-300 text-green-600 hover:bg-green-50" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                            >
                              {u.is_blocked ? "Unblock" : "Block"}
                            </button>
                          )}
                          {u.role !== "admin" && (
                            <button
                              disabled={acting === u.id}
                              onClick={() => handleDelete(u.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
