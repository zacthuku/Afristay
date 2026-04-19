import { Link } from "react-router-dom";
import logo from "../assets/afristay svg.svg";

const EXPLORE = [
  { label: "City Stays",       to: "/search?category=city" },
  { label: "Beach Villas",     to: "/search?category=beach" },
  { label: "Safari Lodges",    to: "/search?category=safari" },
  { label: "Weekend Escapes",  to: "/search?category=weekend" },
  { label: "All Stays",        to: "/search" },
];

const HOSTING = [
  { label: "Become a Host",        to: "/host" },
  { label: "Host Resources",       to: "/host-resources" },
  { label: "Community",            to: "/community" },
  { label: "Responsible Hosting",  to: "/responsible-hosting" },
];

const COMPANY = [
  { label: "About Us",  to: "/about" },
  { label: "Careers",   to: "/careers" },
  { label: "Press",     to: "/press" },
  { label: "Contact",   to: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[#1a0e07] text-white px-4 md:px-10 pt-14 pb-8">

      {/* Top grid */}
      <div className="max-w-[1280px] mx-auto flex flex-wrap md:flex-nowrap justify-between gap-10 pb-12 border-b border-white/10">

        {/* Brand */}
        <div className="min-w-[200px] flex-1 max-w-xs">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src={logo} alt="AfriStay" className="w-6 h-6 brightness-200" />
            <span className="font-serif font-bold text-xl text-white">
              Afri<span className="text-[#C4622D]">Stay</span>
            </span>
          </Link>
          <p className="text-white/50 text-sm leading-relaxed">
            Africa's most authentic accommodation marketplace. Connecting travellers
            to extraordinary stays across the continent.
          </p>
          {/* Social icons */}
          <div className="flex gap-3 mt-6">
            {["𝕏", "f", "in", "📸"].map((s, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-xs text-white/50 hover:border-[#C4622D] hover:text-[#C4622D] cursor-pointer transition-colors"
              >
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Explore */}
        <div className="min-w-[140px]">
          <h3 className="mb-4 font-semibold text-white text-sm uppercase tracking-wider">Explore</h3>
          <ul className="space-y-2.5">
            {EXPLORE.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="text-white/50 text-sm hover:text-[#C4622D] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Hosting */}
        <div className="min-w-[140px]">
          <h3 className="mb-4 font-semibold text-white text-sm uppercase tracking-wider">Hosting</h3>
          <ul className="space-y-2.5">
            {HOSTING.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="text-white/50 text-sm hover:text-[#C4622D] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div className="min-w-[140px]">
          <h3 className="mb-4 font-semibold text-white text-sm uppercase tracking-wider">Company</h3>
          <ul className="space-y-2.5">
            {COMPANY.map((item) => (
              <li key={item.label}>
                <Link to={item.to} className="text-white/50 text-sm hover:text-[#C4622D] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Newsletter */}
        <div className="min-w-[200px] flex-1 max-w-xs">
          <h3 className="mb-4 font-semibold text-white text-sm uppercase tracking-wider">Stay in the loop</h3>
          <p className="text-white/50 text-sm mb-4">Get travel inspiration and exclusive deals in your inbox.</p>
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="you@email.com"
              className="flex-1 bg-white/10 border border-white/20 rounded-full px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C4622D] transition-colors"
            />
            <button className="bg-[#C4622D] text-white px-4 py-2 rounded-full text-sm hover:bg-[#a94e20] transition-colors flex-shrink-0">
              Join
            </button>
          </div>
        </div>

      </div>

      {/* Bottom bar */}
      <div className="max-w-[1280px] mx-auto mt-8 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-white/30">
        <span>© {new Date().getFullYear()} AfriStay Ltd. Nairobi, Kenya.</span>
        <div className="flex gap-5">
          <Link to="/about"   className="hover:text-[#C4622D] transition-colors">Privacy</Link>
          <Link to="/about"   className="hover:text-[#C4622D] transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-[#C4622D] transition-colors">Support</Link>
        </div>
      </div>

    </footer>
  );
}
