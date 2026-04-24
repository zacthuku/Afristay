import { useState, useEffect } from "react";
import { jobService } from "../services/api";

const PERKS = [
  { icon: "🌍", label: "Pan-African Mission" },
  { icon: "🏠", label: "Remote-friendly" },
  { icon: "📈", label: "Equity + Competitive pay" },
  { icon: "🩺", label: "Health insurance" },
  { icon: "✈️", label: "Annual travel stipend" },
  { icon: "🎓", label: "Learning & development budget" },
];

export default function Careers() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen]       = useState(null);

  useEffect(() => {
    jobService.listActive()
      .then(setJobs)
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      {/* Hero */}
      <div className="bg-[#3D2B1A] text-white py-20 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Join Our Team</h1>
        <p className="text-white/60 max-w-xl mx-auto text-lg">
          Help us build the future of African travel. We're a small, passionate team with big ambitions.
        </p>
      </div>

      {/* Perks */}
      <section className="max-w-4xl mx-auto px-6 py-14">
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-8 text-center">Why AfriStayHub?</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {PERKS.map((p) => (
            <div key={p.label} className="bg-white border border-[#E8D9B8] rounded-2xl p-5 flex items-center gap-3">
              <span className="text-2xl">{p.icon}</span>
              <span className="text-[#3D2B1A] font-medium text-sm">{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Job Openings */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-[#3D2B1A] mb-6">Open Roles</h2>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C4622D] border-t-transparent" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="bg-white border border-[#E8D9B8] rounded-2xl p-12 text-center">
            <div className="text-4xl mb-3">💼</div>
            <p className="text-gray-400 mb-2">No open positions right now.</p>
            <p className="text-sm text-gray-400">
              Send your CV to{" "}
              <a href="mailto:careers@afristayhub.co.ke" className="text-[#C4622D]">careers@afristayhub.co.ke</a>
              {" "}and we'll reach out when something fits.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map((job, i) => (
              <div key={job.id} className="bg-white border border-[#E8D9B8] rounded-2xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-5 text-left"
                  onClick={() => setOpen(open === i ? null : i)}
                >
                  <div>
                    <p className="font-semibold text-[#3D2B1A]">{job.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {job.team} · {job.location} · {job.employment_type}
                    </p>
                  </div>
                  <span className="text-[#C4622D] text-lg font-bold ml-4 flex-shrink-0">
                    {open === i ? "−" : "+"}
                  </span>
                </button>
                {open === i && (
                  <div className="px-5 pb-5 border-t border-[#E8D9B8]">
                    <p className="text-gray-600 text-sm leading-relaxed mt-4 mb-3">{job.description}</p>
                    {job.requirements && (
                      <div className="bg-[#FAF6EF] rounded-xl p-4 mb-4">
                        <p className="text-xs font-semibold text-[#3D2B1A] uppercase tracking-wide mb-2">Requirements</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{job.requirements}</p>
                      </div>
                    )}
                    <a
                      href={`mailto:careers@afristayhub.co.ke?subject=Application: ${job.title}`}
                      className="inline-block bg-[#C4622D] text-white px-6 py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition"
                    >
                      Apply Now
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
