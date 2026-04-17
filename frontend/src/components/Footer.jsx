import { Link } from "react-router-dom";

const EXPLORE = [
  { label: "City Stays", to: "/search?category=city" },
  { label: "Beach Villas", to: "/search?category=beach" },
  { label: "Safari Lodges", to: "/search?category=safari" },
  { label: "Weekend Escapes", to: "/search?category=weekend" },
  { label: "All Stays", to: "/search" },
];

const HOSTING = [
  { label: "Become a Host", to: "/host" },
  { label: "Host Resources", to: "/host-resources" },
  { label: "Community", to: "/community" },
  { label: "Responsible Hosting", to: "/responsible-hosting" },
];

const COMPANY = [
  { label: "About Us", to: "/about" },
  { label: "Careers", to: "/careers" },
  { label: "Press", to: "/press" },
  { label: "Contact", to: "/contact" },
];

export default function Footer() {
  return (
    <footer className="bg-[#FAF6EF] text-black px-4 md:px-10 py-12">

      {/* Top Section */}
      <div className="flex flex-wrap md:flex-nowrap justify-between gap-8">

        {/* Brand */}
        <div className="min-w-[200px] flex-1">
          <Link to="/" className="text-xl font-bold mb-3 inline-block">
            Afri<span className="text-[#C4622D]">Stay</span>
          </Link>
          <p className="text-black/60 text-sm leading-relaxed">
            Africa's most authentic accommodation marketplace. Connecting travelers
            to extraordinary stays across the continent.
          </p>
        </div>

        {/* Explore */}
        <div className="min-w-[150px]">
          <h3 className="mb-3 font-semibold">Explore</h3>
          <ul className="space-y-2 text-sm">
            {EXPLORE.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="text-black/70 hover:text-[#C4622D] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Hosting */}
        <div className="min-w-[150px]">
          <h3 className="mb-3 font-semibold">Hosting</h3>
          <ul className="space-y-2 text-sm">
            {HOSTING.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="text-black/70 hover:text-[#C4622D] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div className="min-w-[150px]">
          <h3 className="mb-3 font-semibold">Company</h3>
          <ul className="space-y-2 text-sm">
            {COMPANY.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.to}
                  className="text-black/70 hover:text-[#C4622D] transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="mt-10 border-t border-black/10 pt-4 flex flex-col md:flex-row justify-between items-center gap-2 text-sm text-black/50">
        <span>© {new Date().getFullYear()} AfriStay Ltd. Nairobi, Kenya.</span>
        <div className="flex gap-4">
          <Link to="/about" className="hover:text-[#C4622D] transition-colors">Privacy</Link>
          <Link to="/about" className="hover:text-[#C4622D] transition-colors">Terms</Link>
          <Link to="/contact" className="hover:text-[#C4622D] transition-colors">Support</Link>
        </div>
      </div>
    </footer>
  );
}
