import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { jobService } from "../services/api";

const TEAMS = ["Engineering", "Design", "Operations", "Marketing", "Finance", "Support", "Other"];
const TYPES = ["Full-time", "Part-time", "Contract", "Remote", "Internship"];

const EMPTY = { title: "", team: "", location: "", employment_type: "Full-time", description: "", requirements: "", is_active: true };

function JobModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const isEdit = !!initial?.id;

  const set = (k, v) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: false })); };

  const fc = (k) => `w-full border rounded-xl p-3 text-sm focus:outline-none focus:border-[#C4622D] transition-colors ${errors[k] ? "border-red-400 bg-red-50" : "border-gray-200"}`;

  const handleSave = async () => {
    const newErrors = {};
    if (!form.title.trim()) newErrors.title = true;
    if (!form.team) newErrors.team = true;
    if (!form.location.trim()) newErrors.location = true;
    if (!form.description.trim()) newErrors.description = true;
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSaving(true);
    try {
      const payload = { ...form, requirements: form.requirements || null };
      const result = isEdit ? await jobService.update(initial.id, payload) : await jobService.create(payload);
      onSave(result, isEdit);
      toast.success(isEdit ? "Job updated." : "Job posted.");
    } catch (e) {
      toast.error(e.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#E8D9B8]">
          <h3 className="text-lg font-bold text-[#3D2B1A]">{isEdit ? "Edit Job Opening" : "Post New Job"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#3D2B1A] uppercase tracking-wide mb-1">Job Title <span className="text-red-500">*</span></label>
            <input type="text" placeholder="e.g. Senior Frontend Engineer" value={form.title} onChange={(e) => set("title", e.target.value)} className={fc("title")} />
            {errors.title && <p className="text-red-500 text-xs mt-1">Title is required.</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Team */}
            <div>
              <label className="block text-xs font-semibold text-[#3D2B1A] uppercase tracking-wide mb-1">Team <span className="text-red-500">*</span></label>
              <select value={form.team} onChange={(e) => set("team", e.target.value)} className={fc("team")}>
                <option value="">Select team</option>
                {TEAMS.map((t) => <option key={t}>{t}</option>)}
              </select>
              {errors.team && <p className="text-red-500 text-xs mt-1">Required.</p>}
            </div>
            {/* Type */}
            <div>
              <label className="block text-xs font-semibold text-[#3D2B1A] uppercase tracking-wide mb-1">Employment Type</label>
              <select value={form.employment_type} onChange={(e) => set("employment_type", e.target.value)} className={fc("employment_type")}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-[#3D2B1A] uppercase tracking-wide mb-1">Location <span className="text-red-500">*</span></label>
            <input type="text" placeholder="e.g. Nairobi / Remote" value={form.location} onChange={(e) => set("location", e.target.value)} className={fc("location")} />
            {errors.location && <p className="text-red-500 text-xs mt-1">Location is required.</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#3D2B1A] uppercase tracking-wide mb-1">Description <span className="text-red-500">*</span></label>
            <textarea rows={4} placeholder="Describe the role, responsibilities, and what success looks like..." value={form.description} onChange={(e) => set("description", e.target.value)} className={`${fc("description")} resize-none`} />
            {errors.description && <p className="text-red-500 text-xs mt-1">Description is required.</p>}
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-xs font-semibold text-[#3D2B1A] uppercase tracking-wide mb-1">Requirements <span className="text-gray-400">(optional)</span></label>
            <textarea rows={3} placeholder="List skills, experience, or qualifications (one per line)..." value={form.requirements} onChange={(e) => set("requirements", e.target.value)} className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-[#C4622D] resize-none" />
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={() => set("is_active", !form.is_active)}
              className={`w-11 h-6 rounded-full transition-colors relative ${form.is_active ? "bg-green-500" : "bg-gray-300"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
            </button>
            <span className="text-sm text-[#3D2B1A]">{form.is_active ? "Active (visible to applicants)" : "Inactive (hidden)"}</span>
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-[#E8D9B8]">
          <button onClick={onClose} className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="bg-[#C4622D] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Post Job"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCareers() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | "new" | job object

  useEffect(() => {
    jobService.listAll()
      .then(setJobs)
      .catch((e) => toast.error(e.message || "Failed to load jobs"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (saved, isEdit) => {
    setJobs((prev) => isEdit ? prev.map((j) => j.id === saved.id ? saved : j) : [saved, ...prev]);
    setModal(null);
  };

  const handleToggle = async (job) => {
    try {
      const updated = await jobService.update(job.id, { ...job, is_active: !job.is_active });
      setJobs((prev) => prev.map((j) => j.id === updated.id ? updated : j));
      toast.success(updated.is_active ? "Job activated." : "Job deactivated.");
    } catch (e) {
      toast.error(e.message || "Update failed.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this job opening?")) return;
    try {
      await jobService.delete(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success("Job deleted.");
    } catch (e) {
      toast.error(e.message || "Delete failed.");
    }
  };

  const active = jobs.filter((j) => j.is_active).length;
  const inactive = jobs.filter((j) => !j.is_active).length;

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      {modal && (
        <JobModal
          initial={modal === "new" ? null : modal}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#3D2B1A]">Careers Management</h1>
            <p className="text-gray-500 mt-1">{active} active · {inactive} inactive</p>
          </div>
          <button
            onClick={() => setModal("new")}
            className="bg-[#C4622D] text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition"
          >
            + Post Job
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#C4622D] border-t-transparent" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-[#E8D9B8] rounded-2xl p-16 text-center">
            <div className="text-5xl mb-3">💼</div>
            <p className="text-gray-400 mb-4">No job openings yet.</p>
            <button onClick={() => setModal("new")} className="bg-[#C4622D] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90">
              Post First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => (
              <div key={job.id} className={`bg-white border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-start gap-4 transition ${job.is_active ? "border-[#E8D9B8]" : "border-gray-200 opacity-60"}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-[#3D2B1A]">{job.title}</h3>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${job.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {job.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">
                    {job.team} · {job.location} · {job.employment_type}
                  </p>
                  <p className="text-sm text-gray-600 line-clamp-2">{job.description}</p>
                  {job.requirements && (
                    <p className="text-xs text-gray-400 mt-1 line-clamp-1">Requirements: {job.requirements}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(job)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${job.is_active ? "border-gray-200 text-gray-600 hover:bg-gray-50" : "border-green-300 text-green-600 hover:bg-green-50"}`}
                  >
                    {job.is_active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => setModal(job)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-[#E8D9B8] text-[#C4622D] hover:bg-[#FFF5EE] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(job.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-200 text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
