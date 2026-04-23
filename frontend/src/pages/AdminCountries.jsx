import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { countryService } from "../services/api";

const EMPTY = {
  code: "", name: "", flag: "", currency_code: "", currency_symbol: "",
  payment_methods: "[]", is_active: true,
};

export default function AdminCountries() {
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: "add"|"edit", data: {} }
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const data = await countryService.getAll();
      setCountries(data);
    } catch (err) {
      toast.error(err.message || "Failed to load countries");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(form) {
    setSaving(true);
    try {
      let pm = form.payment_methods;
      try { pm = JSON.parse(form.payment_methods); } catch { pm = []; }
      const payload = { ...form, payment_methods: pm };
      if (modal.mode === "add") {
        await countryService.create(payload);
        toast.success("Country created");
      } else {
        await countryService.update(modal.data.code, payload);
        toast.success("Country updated");
      }
      setModal(null);
      load();
    } catch (err) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate(code) {
    if (!window.confirm(`Deactivate country ${code}?`)) return;
    try {
      await countryService.deactivate(code);
      toast.success("Country deactivated");
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
          <h1 className="text-2xl font-bold text-[#3D2B1A]">Manage Countries</h1>
        </div>

        <div className="flex justify-end mb-4">
          <button
            onClick={() => setModal({ mode: "add", data: { ...EMPTY } })}
            className="bg-[#C4622D] text-white px-5 py-2 rounded-full text-sm font-semibold hover:opacity-90"
          >
            + Add Country
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8D9B8] overflow-hidden">
          {loading ? (
            <div className="p-10 text-center text-gray-400">Loading…</div>
          ) : countries.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No countries yet. Add one above.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#FAF6EF] text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Flag & Code</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Name</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Currency</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Payment Methods</th>
                  <th className="px-4 py-3 font-semibold text-[#3D2B1A]">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {countries.map((c) => (
                  <tr key={c.code} className="hover:bg-[#FAF6EF]">
                    <td className="px-4 py-3 font-medium">{c.flag} {c.code}</td>
                    <td className="px-4 py-3">{c.name}</td>
                    <td className="px-4 py-3">{c.currency_symbol} ({c.currency_code})</td>
                    <td className="px-4 py-3">
                      {(c.payment_methods || []).map(m => m.label).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${c.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {c.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2">
                      <button
                        onClick={() => setModal({ mode: "edit", data: { ...c, payment_methods: JSON.stringify(c.payment_methods || [], null, 2) } })}
                        className="text-[#C4622D] text-xs font-semibold hover:underline"
                      >
                        Edit
                      </button>
                      {c.is_active && (
                        <button
                          onClick={() => handleDeactivate(c.code)}
                          className="text-red-500 text-xs font-semibold hover:underline"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {modal && (
        <CountryModal
          mode={modal.mode}
          data={modal.data}
          saving={saving}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function CountryModal({ mode, data, saving, onSave, onClose }) {
  const [form, setForm] = useState({ ...data });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl mx-4 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold text-[#3D2B1A] mb-4">
          {mode === "add" ? "Add Country" : `Edit ${form.name}`}
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Code (2-letter)" value={form.code} onChange={v => set("code", v.toUpperCase())} placeholder="KE" disabled={mode === "edit"} />
            <Field label="Flag emoji" value={form.flag} onChange={v => set("flag", v)} placeholder="🇰🇪" />
          </div>
          <Field label="Name" value={form.name} onChange={v => set("name", v)} placeholder="Kenya" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Currency Code" value={form.currency_code} onChange={v => set("currency_code", v.toUpperCase())} placeholder="KES" />
            <Field label="Currency Symbol" value={form.currency_symbol} onChange={v => set("currency_symbol", v)} placeholder="KES" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Payment Methods (JSON array)</label>
            <textarea
              value={form.payment_methods}
              onChange={e => set("payment_methods", e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-gray-200 p-3 text-xs font-mono focus:outline-none focus:border-[#C4622D] resize-none"
              placeholder={`[{"id":"mpesa","label":"M-Pesa","color":"#00A650","backendId":"mpesa","available":true}]`}
            />
            <p className="text-xs text-gray-400 mt-1">Each entry: id, label, color, backendId, available (bool), comingSoon (optional bool)</p>
          </div>
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

function Field({ label, value, onChange, placeholder, disabled }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:border-[#C4622D] disabled:bg-gray-50 disabled:text-gray-400"
      />
    </div>
  );
}
