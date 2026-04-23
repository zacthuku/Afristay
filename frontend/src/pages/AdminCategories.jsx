import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { configService } from "../services/api";

const EMPTY = {
  slug: "", name: "", icon: "", location_keyword: "",
  display_bg: "bg-amber-50", display_border: "border-amber-200", display_text: "text-amber-800",
  category_type: "experience", is_active: true, display_order: 0,
};

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setCategories(await configService.getCategories()); }
    catch (err) { toast.error(err.message || "Failed to load categories"); }
    finally { setLoading(false); }
  }

  async function handleSave(form) {
    setSaving(true);
    try {
      if (modal.mode === "add") {
        await configService.createCategory(form);
        toast.success("Category created");
      } else {
        await configService.updateCategory(modal.data.id, form);
        toast.success("Category updated");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this category?")) return;
    try {
      await configService.deleteCategory(id);
      toast.success("Category deleted");
      load();
    } catch (err) {
      toast.error(err.message || "Failed");
    }
  }

  return (
    <div className="min-h-screen bg-[#FAF6EF] p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/admin" className="text-sm text-[#C4622D] hover:underline">← Admin</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-[#3D2B1A]">Manage Categories</h1>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setModal({ mode: "add", data: { ...EMPTY } })}
            className="bg-[#C4622D] text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90"
          >
            + Add Category
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading…</div>
          ) : categories.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No categories yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#FAF6EF] text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Icon & Name</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Slug</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Type</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Location Keyword</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Order</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-[#FAF6EF]">
                    <td className="px-4 py-3">{c.icon} {c.name}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.category_type === "experience" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
                        {c.category_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{c.location_keyword || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{c.display_order}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => setModal({ mode: "edit", data: { ...c } })} className="text-[#C4622D] text-xs font-semibold hover:underline">Edit</button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 text-xs font-semibold hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <CategoryModal mode={modal.mode} data={modal.data} saving={saving} onSave={handleSave} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function CategoryModal({ mode, data, saving, onSave, onClose }) {
  const [form, setForm] = useState({ ...data });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#3D2B1A] mb-4">{mode === "add" ? "Add Category" : "Edit Category"}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <F label="Slug" value={form.slug} onChange={v => set("slug", v)} placeholder="safari" />
            <F label="Icon emoji" value={form.icon} onChange={v => set("icon", v)} placeholder="🦁" />
          </div>
          <F label="Name" value={form.name} onChange={v => set("name", v)} placeholder="Safari Lodges" />
          <F label="Location Keyword (for search)" value={form.location_keyword} onChange={v => set("location_keyword", v)} placeholder="mara" />
          <div>
            <label className="block text-sm font-medium mb-1">Category Type</label>
            <select value={form.category_type} onChange={e => set("category_type", e.target.value)} className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#C4622D]">
              <option value="experience">experience</option>
              <option value="adventure">adventure</option>
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <F label="BG class" value={form.display_bg} onChange={v => set("display_bg", v)} placeholder="bg-amber-50" />
            <F label="Border class" value={form.display_border} onChange={v => set("display_border", v)} placeholder="border-amber-200" />
            <F label="Text class" value={form.display_text} onChange={v => set("display_text", v)} placeholder="text-amber-800" />
          </div>
          <F label="Display Order" value={String(form.display_order)} onChange={v => set("display_order", Number(v) || 0)} placeholder="0" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} />
            Active
          </label>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">Cancel</button>
          <button onClick={() => onSave(form)} disabled={saving} className="rounded-xl bg-[#C4622D] text-white px-5 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

function F({ label, value, onChange, placeholder }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#C4622D]" />
    </div>
  );
}
