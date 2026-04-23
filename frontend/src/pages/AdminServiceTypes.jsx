import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { configService } from "../services/api";

const EMPTY = {
  slug: "", label: "", icon: "", description: "",
  pricing_types: '["per_night","fixed"]', category: "accommodation",
  is_active: true, display_order: 0,
};

export default function AdminServiceTypes() {
  const [types, setTypes]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [saving, setSaving]   = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try { setTypes(await configService.getServiceTypes()); }
    catch (err) { toast.error(err.message || "Failed to load service types"); }
    finally { setLoading(false); }
  }

  async function handleSave(form) {
    setSaving(true);
    try {
      let pt = form.pricing_types;
      try { pt = JSON.parse(form.pricing_types); } catch { pt = []; }
      const payload = { ...form, pricing_types: pt };
      if (modal.mode === "add") {
        await configService.createServiceType(payload);
        toast.success("Service type created");
      } else {
        await configService.updateServiceType(modal.data.id, payload);
        toast.success("Service type updated");
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
    if (!window.confirm("Delete this service type?")) return;
    try {
      await configService.deleteServiceType(id);
      toast.success("Deleted");
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
          <h1 className="text-2xl font-bold text-[#3D2B1A]">Manage Service Types</h1>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setModal({ mode: "add", data: { ...EMPTY } })}
            className="bg-[#C4622D] text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90"
          >
            + Add Service Type
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading…</div>
          ) : types.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No service types yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#FAF6EF] text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Icon & Label</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Slug</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Category</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Pricing Types</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Order</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {types.map((t) => (
                  <tr key={t.id} className="hover:bg-[#FAF6EF]">
                    <td className="px-4 py-3">{t.icon} {t.label}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{t.slug}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${t.category === "accommodation" ? "bg-green-100 text-green-700" : t.category === "transport" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                        {t.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{(t.pricing_types || []).join(", ")}</td>
                    <td className="px-4 py-3 text-gray-500">{t.display_order}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => setModal({ mode: "edit", data: { ...t, pricing_types: JSON.stringify(t.pricing_types || []) } })} className="text-[#C4622D] text-xs font-semibold hover:underline">Edit</button>
                      <button onClick={() => handleDelete(t.id)} className="text-red-500 text-xs font-semibold hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <TypeModal mode={modal.mode} data={modal.data} saving={saving} onSave={handleSave} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function TypeModal({ mode, data, saving, onSave, onClose }) {
  const [form, setForm] = useState({ ...data, pricing_types: typeof data.pricing_types === "string" ? data.pricing_types : JSON.stringify(data.pricing_types || []) });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#3D2B1A] mb-4">{mode === "add" ? "Add Service Type" : "Edit Service Type"}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <F label="Slug" value={form.slug} onChange={v => set("slug", v)} placeholder="hotel" disabled={mode === "edit"} />
            <F label="Icon emoji" value={form.icon} onChange={v => set("icon", v)} placeholder="🏨" />
          </div>
          <F label="Label" value={form.label} onChange={v => set("label", v)} placeholder="Hotels" />
          <F label="Description" value={form.description} onChange={v => set("description", v)} placeholder="Hotels, motels, resorts" />
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select value={form.category} onChange={e => set("category", e.target.value)} className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#C4622D]">
              <option value="accommodation">accommodation</option>
              <option value="transport">transport</option>
              <option value="experience">experience</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Pricing Types (JSON array of slugs)</label>
            <input value={form.pricing_types} onChange={e => set("pricing_types", e.target.value)}
              placeholder='["per_night","fixed"]'
              className="w-full rounded-xl border border-gray-200 p-3 text-sm font-mono focus:outline-none focus:border-[#C4622D]" />
            <p className="text-xs text-gray-400 mt-1">Options: per_night, per_hour, per_day, per_km, per_person, fixed</p>
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

function F({ label, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#C4622D] disabled:bg-gray-50 disabled:text-gray-400" />
    </div>
  );
}
