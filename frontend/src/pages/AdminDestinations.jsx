import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { configService, countryService } from "../services/api";

const EMPTY = {
  name: "", slug: "", subtitle: "", image_url: "", country_code: "",
  is_featured: true, display_order: 0, is_active: true,
};

export default function AdminDestinations() {
  const [destinations, setDestinations] = useState([]);
  const [countries, setCountries]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(null);
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    load();
    countryService.getAll().then(setCountries).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try { setDestinations(await configService.getDestinations()); }
    catch (err) { toast.error(err.message || "Failed to load destinations"); }
    finally { setLoading(false); }
  }

  async function handleSave(form) {
    setSaving(true);
    try {
      if (modal.mode === "add") {
        await configService.createDestination(form);
        toast.success("Destination created");
      } else {
        await configService.updateDestination(modal.data.id, form);
        toast.success("Destination updated");
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
    if (!window.confirm("Delete this destination?")) return;
    try {
      await configService.deleteDestination(id);
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
          <h1 className="text-2xl font-bold text-[#3D2B1A]">Manage Destinations</h1>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setModal({ mode: "add", data: { ...EMPTY } })}
            className="bg-[#C4622D] text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90"
          >
            + Add Destination
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading…</div>
          ) : destinations.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No destinations yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#FAF6EF] text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Image</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Name</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Subtitle</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Country</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Order</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {destinations.map((d) => (
                  <tr key={d.id} className="hover:bg-[#FAF6EF]">
                    <td className="px-4 py-3">
                      {d.image_url
                        ? <img src={d.image_url} alt={d.name} className="w-12 h-10 object-cover rounded-lg" />
                        : <div className="w-12 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-300 text-xs">No img</div>
                      }
                    </td>
                    <td className="px-4 py-3 font-medium text-[#3D2B1A]">{d.name}</td>
                    <td className="px-4 py-3 text-gray-500">{d.subtitle || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{d.country_code || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{d.display_order}</td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button onClick={() => setModal({ mode: "edit", data: { ...d } })} className="text-[#C4622D] text-xs font-semibold hover:underline">Edit</button>
                      <button onClick={() => handleDelete(d.id)} className="text-red-500 text-xs font-semibold hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <DestModal mode={modal.mode} data={modal.data} saving={saving} countries={countries} onSave={handleSave} onClose={() => setModal(null)} />
      )}
    </div>
  );
}

function DestModal({ mode, data, saving, countries, onSave, onClose }) {
  const [form, setForm] = useState({ ...data });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#3D2B1A] mb-4">{mode === "add" ? "Add Destination" : "Edit Destination"}</h3>
        <div className="space-y-3">
          <F label="Name" value={form.name} onChange={v => set("name", v)} placeholder="Nairobi" />
          <F label="Slug (for search URL)" value={form.slug} onChange={v => set("slug", v)} placeholder="city" />
          <F label="Subtitle" value={form.subtitle} onChange={v => set("subtitle", v)} placeholder="City Stays" />
          <F label="Image URL" value={form.image_url} onChange={v => set("image_url", v)} placeholder="https://…" />
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select value={form.country_code} onChange={e => set("country_code", e.target.value)} className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#C4622D]">
              <option value="">— None —</option>
              {countries.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
            </select>
          </div>
          <F label="Display Order" value={String(form.display_order)} onChange={v => set("display_order", Number(v) || 0)} placeholder="0" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_featured} onChange={e => set("is_featured", e.target.checked)} />
            Featured
          </label>
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
