import { useState, useContext, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import logo from "../assets/afristay svg.svg";

// ─── static data ────────────────────────────────────────────────────
const COUNTRIES = ["Kenya", "Uganda", "Tanzania", "Rwanda"];

const ADVENTURES = [
  { label: "Game Drives",      slug: "game-drives", icon: "🦁" },
  { label: "Beach Activities", slug: "beach",        icon: "🏖️" },
  { label: "Cultural Tours",   slug: "cultural",     icon: "🎭" },
  { label: "Hiking & Nature",  slug: "hiking",       icon: "🏔️" },
  { label: "Water Sports",     slug: "water-sports", icon: "🤿" },
];

const STAYS = [
  { label: "Hotels",       slug: "hotel",     icon: "🏨" },
  { label: "Villas",       slug: "villa",     icon: "🏡" },
  { label: "Apartments",   slug: "apartment", icon: "🏢" },
  { label: "Penthouses",   slug: "penthouse", icon: "🌆" },
  { label: "Unique Stays", slug: "unique",    icon: "🌳" },
];

const TRANSPORT = [
  { label: "Flights",       slug: "flight",       icon: "✈️" },
  { label: "Trains",        slug: "train",         icon: "🚂" },
  { label: "Buses",         slug: "bus",           icon: "🚌" },
  { label: "Car Hire",      slug: "car-hire",      icon: "🚗" },
  { label: "Ride-hailing",  slug: "ride-hailing",  icon: "🚕" },
  { label: "Boats/Ferries", slug: "ferry",         icon: "⛵" },
];

const MORE_LINKS = [
  { label: "About",          path: "/about" },
  { label: "Help & Support", path: "/contact" },
  { label: "Contact",        path: "/contact" },
  { label: "Become a Host",  path: "/host" },
  { label: "Policies",       path: "/responsible-hosting" },
];

// ─── helpers ────────────────────────────────────────────────────────
function getInitials(user) {
  if (!user) return "";
  return (user.name || user.email || "").charAt(0).toUpperCase();
}

// ─── inline SVG icons ───────────────────────────────────────────────
const ChevronDown = ({ open }) => (
  <svg
    className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

const CartIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.5 6h13M7 13L5.4 5M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
  </svg>
);

const GlobeIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round"
      d="M2 12h20M12 2c-2.761 3.156-4 6.5-4 10s1.239 6.844 4 10M12 2c2.761 3.156 4 6.5 4 10s-1.239 6.844-4 10" />
  </svg>
);

const StarIcon = () => (
  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

// ─── dropdown panel ─────────────────────────────────────────────────
function DropPanel({ children, className = "", style }) {
  return (
    <div style={style} className={`absolute top-full bg-white shadow-xl rounded-2xl border border-[#E8D9B8] z-50 ${className}`}>
      {children}
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────
export default function Navbar() {
  const location = useLocation();
  const { user, logout, cartCount } = useContext(AppContext);

  const savedScrollY = useRef(0);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const [country, setCountry] = useState(
    () => localStorage.getItem("afristay_country") || "Kenya"
  );

  const handleCountryChange = (c) => {
    setCountry(c);
    localStorage.setItem("afristay_country", c);
    setOpenMenu(null);
  };

  const isActive = (path) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const navLinkClass = (path) =>
    `flex items-center gap-1 text-[13px] font-medium px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
      isActive(path) ? "text-[#C4622D] font-semibold" : "text-[#5C4230] hover:text-[#C4622D]"
    }`;

  function openMobileMenu() {
    savedScrollY.current = window.scrollY;
    setIsOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function closeMobileMenu() {
    setIsOpen(false);
    requestAnimationFrame(() => {
      window.scrollTo({ top: savedScrollY.current, behavior: "instant" });
    });
  }

  function navigateFromMenu() {
    setIsOpen(false);
    setExpandedSection(null);
  }

  const toggleSection = (section) =>
    setExpandedSection((s) => (s === section ? null : section));

  return (
    <>
      <nav className="sticky top-0 z-50 bg-[#FAF6EF] border-b border-[#E8D9B8] px-4 lg:px-8 flex items-center justify-between h-[68px]">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src={logo} alt="AfriStay Logo" className="w-6 h-6" />
          <span className="font-serif font-bold text-[20px] text-[#3D2B1A]">
            Afri<span className="text-[#C4622D]">Stay</span>
          </span>
        </Link>

        {/* Desktop nav items */}
        <div className="hidden md:flex items-center gap-0.5">

          {/* Country selector */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu("country")}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button className={navLinkClass("")}>
              <GlobeIcon />
              {country}
              <ChevronDown open={openMenu === "country"} />
            </button>
            {openMenu === "country" && (
              <DropPanel className="left-0 w-40 py-1 mt-0.5">
                {COUNTRIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => handleCountryChange(c)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#FAF6EF] ${
                      c === country ? "text-[#C4622D] font-semibold" : "text-[#3D2B1A]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </DropPanel>
            )}
          </div>

          {/* Explore */}
          <Link to="/" className={navLinkClass("/")}>Explore</Link>

          {/* Plan Trip — primary CTA */}
          <Link
            to="/plan"
            className="flex items-center gap-1.5 bg-[#C4622D] text-white px-4 py-1.5 rounded-full text-[13px] font-semibold hover:bg-[#a8521f] transition-colors mx-1 whitespace-nowrap"
          >
            <StarIcon />
            Plan Trip
          </Link>

          {/* Adventures */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu("adventures")}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button className={navLinkClass("/search?category=")}>
              Adventures <ChevronDown open={openMenu === "adventures"} />
            </button>
            {openMenu === "adventures" && (
              <DropPanel className="left-0 p-4 mt-0.5" style={{ minWidth: "480px" }}>
                <p className="text-[10px] uppercase tracking-widest text-[#5C4230] font-semibold mb-3 px-1">
                  Experiences
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {ADVENTURES.map(({ label, slug, icon }) => (
                    <Link
                      key={slug}
                      to={`/search?category=${slug}`}
                      onClick={() => setOpenMenu(null)}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-[#FAF6EF] transition-colors text-center"
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs text-[#3D2B1A] font-medium leading-tight">{label}</span>
                    </Link>
                  ))}
                </div>
              </DropPanel>
            )}
          </div>

          {/* Stays */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu("stays")}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button className={navLinkClass("/search?type=")}>
              Stays <ChevronDown open={openMenu === "stays"} />
            </button>
            {openMenu === "stays" && (
              <DropPanel className="left-0 p-4 mt-0.5" style={{ minWidth: "440px" }}>
                <p className="text-[10px] uppercase tracking-widest text-[#5C4230] font-semibold mb-3 px-1">
                  Accommodation
                </p>
                <div className="grid grid-cols-5 gap-1">
                  {STAYS.map(({ label, slug, icon }) => (
                    <Link
                      key={slug}
                      to={`/search?type=${slug}`}
                      onClick={() => setOpenMenu(null)}
                      className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl hover:bg-[#FAF6EF] transition-colors text-center"
                    >
                      <span className="text-2xl">{icon}</span>
                      <span className="text-xs text-[#3D2B1A] font-medium leading-tight">{label}</span>
                    </Link>
                  ))}
                </div>
              </DropPanel>
            )}
          </div>

          {/* Transport */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu("transport")}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button className={navLinkClass("/search?mode=transport")}>
              Transport <ChevronDown open={openMenu === "transport"} />
            </button>
            {openMenu === "transport" && (
              <DropPanel className="left-0 p-4 mt-0.5" style={{ minWidth: "480px" }}>
                <p className="text-[10px] uppercase tracking-widest text-[#5C4230] font-semibold mb-3 px-1">
                  Getting Around
                </p>
                <div className="grid grid-cols-3 gap-1">
                  {TRANSPORT.map(({ label, slug, icon }) => (
                    <Link
                      key={slug}
                      to={`/search?mode=transport&type=${slug}`}
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-[#FAF6EF] transition-colors"
                    >
                      <span className="text-xl">{icon}</span>
                      <span className="text-sm text-[#3D2B1A] font-medium">{label}</span>
                    </Link>
                  ))}
                </div>
              </DropPanel>
            )}
          </div>

          {/* More */}
          <div
            className="relative"
            onMouseEnter={() => setOpenMenu("more")}
            onMouseLeave={() => setOpenMenu(null)}
          >
            <button className={navLinkClass("")}>
              More <ChevronDown open={openMenu === "more"} />
            </button>
            {openMenu === "more" && (
              <DropPanel className="left-0 w-48 py-1 mt-0.5">
                {MORE_LINKS.map(({ label, path }) => (
                  <Link
                    key={label}
                    to={path}
                    onClick={() => setOpenMenu(null)}
                    className="block px-4 py-2.5 text-sm text-[#3D2B1A] hover:bg-[#FAF6EF] hover:text-[#C4622D] transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </DropPanel>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-2">
          {!user ? (
            <>
              <Link
                to="/login"
                className="border border-[#3D2B1A] px-4 py-1.5 rounded-full text-[13px] font-medium hover:border-[#C4622D] hover:text-[#C4622D] transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-[#C4622D] text-white px-4 py-1.5 rounded-full text-[13px] font-medium hover:bg-[#a8521f] transition-colors"
              >
                Get Started
              </Link>
            </>
          ) : (
            <>
              {/* Cart with badge */}
              <Link to="/cart" className="relative p-2 text-[#5C4230] hover:text-[#C4622D] transition-colors" title="Cart">
                <CartIcon />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#C4622D] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Profile dropdown — hover */}
              <div
                className="relative"
                onMouseEnter={() => setOpenMenu("profile")}
                onMouseLeave={() => setOpenMenu(null)}
              >
                <button className="w-9 h-9 flex items-center justify-center rounded-full bg-[#C4622D] text-white font-semibold text-sm hover:bg-[#a8521f] transition-colors">
                  {getInitials(user)}
                </button>

                {openMenu === "profile" && (
                  <DropPanel className="right-0 w-52 py-2 mt-0.5">
                    <div className="px-4 py-2 border-b border-[#E8D9B8] mb-1">
                      <p className="text-xs font-semibold text-[#3D2B1A] truncate">{user.name || user.email}</p>
                      <p className="text-[10px] text-[#5C4230] capitalize">{user.role}</p>
                    </div>

                    {[
                      { to: "/profile",  icon: "👤", label: "Profile" },
                      { to: "/bookings", icon: "🗓️", label: "My Bookings" },
                      { to: "/settings", icon: "⚙️", label: "Settings" },
                    ].map(({ to, icon, label }) => (
                      <Link key={to} to={to} onClick={() => setOpenMenu(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#3D2B1A] hover:bg-[#FAF6EF] hover:text-[#C4622D] transition-colors">
                        {icon} {label}
                      </Link>
                    ))}

                    {user.role === "host" && (
                      <Link to="/host/dashboard" onClick={() => setOpenMenu(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#3D2B1A] hover:bg-[#FAF6EF] hover:text-[#C4622D] transition-colors">
                        🏠 Host Dashboard
                      </Link>
                    )}

                    {user.role === "admin" && (
                      <>
                        <div className="px-4 pt-2 pb-0.5 text-[10px] uppercase tracking-widest text-[#5C4230] font-semibold">Admin</div>
                        {[
                          { to: "/admin",           icon: "📊", label: "Dashboard" },
                          { to: "/admin/users",      icon: "👥", label: "Manage Users" },
                          { to: "/admin/approvals",  icon: "✅", label: "Approvals" },
                          { to: "/admin/careers",    icon: "💼", label: "Manage Careers" },
                        ].map(({ to, icon, label }) => (
                          <Link key={to} to={to} onClick={() => setOpenMenu(null)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-[#3D2B1A] hover:bg-[#FAF6EF] hover:text-[#C4622D] transition-colors">
                            {icon} {label}
                          </Link>
                        ))}
                      </>
                    )}

                    {user.role === "user" && (
                      <Link to="/dashboard" onClick={() => setOpenMenu(null)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#3D2B1A] hover:bg-[#FAF6EF] hover:text-[#C4622D] transition-colors">
                        📊 My Dashboard
                      </Link>
                    )}

                    <div className="border-t border-[#E8D9B8] mt-1" />
                    <button
                      onClick={() => { logout(); setOpenMenu(null); }}
                      className="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      🚪 Logout
                    </button>
                  </DropPanel>
                )}
              </div>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden p-2" onClick={() => (isOpen ? closeMobileMenu() : openMobileMenu())}>
          <svg className="w-6 h-6 text-[#3D2B1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen
              ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            }
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-[#FAF6EF] border-b border-[#E8D9B8] px-4 pb-6 overflow-y-auto max-h-[calc(100vh-68px)]">

          <Link to="/" onClick={navigateFromMenu}
            className="block py-3 border-b border-[#E8D9B8] text-[14px] font-medium text-[#5C4230] hover:text-[#C4622D]">
            Explore
          </Link>

          <Link to="/plan" onClick={navigateFromMenu}
            className="flex items-center gap-2 py-3 border-b border-[#E8D9B8] text-[14px] font-semibold text-[#C4622D]">
            <StarIcon /> Plan Trip
          </Link>

          {/* Accordion sections */}
          {[
            { key: "adventures", label: "Adventures",  items: ADVENTURES, linkFn: (slug) => `/search?category=${slug}` },
            { key: "stays",      label: "Stays",       items: STAYS,      linkFn: (slug) => `/search?type=${slug}` },
            { key: "transport",  label: "Transport",   items: TRANSPORT,  linkFn: (slug) => `/search?mode=transport&type=${slug}` },
          ].map(({ key, label, items, linkFn }) => (
            <div key={key} className="border-b border-[#E8D9B8]">
              <button
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between py-3 text-[14px] font-medium text-[#5C4230]"
              >
                {label}
                <ChevronDown open={expandedSection === key} />
              </button>
              {expandedSection === key && (
                <div className="pb-2 grid grid-cols-2 gap-1">
                  {items.map(({ label: lbl, slug, icon }) => (
                    <Link key={slug} to={linkFn(slug)} onClick={navigateFromMenu}
                      className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[#E8D9B8] text-sm text-[#3D2B1A]">
                      <span>{icon}</span>{lbl}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Country selector */}
          <div className="border-b border-[#E8D9B8]">
            <button
              onClick={() => toggleSection("country")}
              className="w-full flex items-center justify-between py-3 text-[14px] font-medium text-[#5C4230]"
            >
              <span className="flex items-center gap-2"><GlobeIcon />{country}</span>
              <ChevronDown open={expandedSection === "country"} />
            </button>
            {expandedSection === "country" && (
              <div className="pb-2">
                {COUNTRIES.map((c) => (
                  <button key={c} onClick={() => { handleCountryChange(c); setExpandedSection(null); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg ${
                      c === country ? "text-[#C4622D] font-semibold" : "text-[#3D2B1A] hover:bg-[#E8D9B8]"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart link */}
          <Link to="/cart" onClick={navigateFromMenu}
            className="flex items-center justify-between py-3 border-b border-[#E8D9B8] text-[14px] font-medium text-[#5C4230] hover:text-[#C4622D]">
            <span className="flex items-center gap-2"><CartIcon />Cart</span>
            {cartCount > 0 && (
              <span className="bg-[#C4622D] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* Auth */}
          <div className="pt-4 space-y-2">
            {!user ? (
              <>
                <Link to="/login" onClick={navigateFromMenu}
                  className="block border border-[#3D2B1A] px-5 py-2.5 rounded-full text-[14px] text-center font-medium">
                  Sign In
                </Link>
                <Link to="/register" onClick={navigateFromMenu}
                  className="block bg-[#C4622D] text-white px-5 py-2.5 rounded-full text-[14px] text-center font-medium">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 py-2">
                  <div className="w-9 h-9 flex items-center justify-center rounded-full bg-[#C4622D] text-white font-semibold text-sm">
                    {getInitials(user)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#3D2B1A]">{user.name || user.email}</p>
                    <p className="text-xs text-[#5C4230] capitalize">{user.role}</p>
                  </div>
                </div>

                {[
                  { to: "/profile",  icon: "👤", label: "Profile" },
                  { to: "/bookings", icon: "🗓️", label: "My Bookings" },
                  { to: "/settings", icon: "⚙️", label: "Settings" },
                ].map(({ to, icon, label }) => (
                  <Link key={to} to={to} onClick={navigateFromMenu}
                    className="flex items-center gap-2 py-2 text-[14px] text-[#5C4230]">
                    {icon} {label}
                  </Link>
                ))}

                {user.role === "host" && (
                  <Link to="/host/dashboard" onClick={navigateFromMenu}
                    className="flex items-center gap-2 py-2 text-[14px] text-[#5C4230]">
                    🏠 Host Dashboard
                  </Link>
                )}

                {user.role === "admin" && (
                  <>
                    <Link to="/admin" onClick={navigateFromMenu} className="flex items-center gap-2 py-2 text-[14px] text-[#5C4230]">📊 Admin Dashboard</Link>
                    <Link to="/admin/users" onClick={navigateFromMenu} className="flex items-center gap-2 py-2 text-[14px] text-[#5C4230]">👥 Manage Users</Link>
                    <Link to="/admin/approvals" onClick={navigateFromMenu} className="flex items-center gap-2 py-2 text-[14px] text-[#5C4230]">✅ Approvals</Link>
                  </>
                )}

                {user.role === "user" && (
                  <Link to="/dashboard" onClick={navigateFromMenu} className="flex items-center gap-2 py-2 text-[14px] text-[#5C4230]">
                    📊 My Dashboard
                  </Link>
                )}

                <button onClick={() => { logout(); navigateFromMenu(); }}
                  className="flex items-center gap-2 py-2 text-[14px] text-red-500">
                  🚪 Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
