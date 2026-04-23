import { useState, useContext, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import logo from "../assets/afristay svg.svg";

// ─── Static nav menu definitions ────────────────────────────────────────────
const ADVENTURES_ITEMS = [
  { label: "Game Drives",      href: "/search?type=adventure&q=game+drive" },
  { label: "Beach Activities", href: "/search?type=adventure&q=beach" },
  { label: "Cultural Tours",   href: "/search?type=attraction&q=cultural" },
  { label: "Hiking & Nature",  href: "/search?type=adventure&q=hiking" },
  { label: "Water Sports",     href: "/search?type=adventure&q=water+sports" },
];

const STAYS_ITEMS = [
  { label: "Hotels",       href: "/search?type=accommodation&q=hotel" },
  { label: "Villas",       href: "/search?type=accommodation&q=villa" },
  { label: "Apartments",   href: "/search?type=accommodation&q=apartment" },
  { label: "Unique Stays", href: "/search?type=accommodation&q=lodge" },
  { label: "Guesthouses",  href: "/search?type=accommodation&q=guesthouse" },
];

const TRANSPORT_ITEMS = [
  { label: "Flights",       href: "/search?type=transport&q=flight" },
  { label: "Buses",         href: "/search?type=transport&q=bus" },
  { label: "Car Hire",      href: "/search?type=transport&q=car" },
  { label: "Ride-hailing",  href: "/search?type=transport&q=ride" },
  { label: "Boats/Ferries", href: "/search?type=transport&q=boat" },
  { label: "Shuttles",      href: "/search?type=transport&q=shuttle" },
];

const MORE_LINKS = [
  { label: "About",          path: "/about" },
  { label: "Help & Support", path: "/contact" },
  { label: "Contact",        path: "/contact" },
  { label: "Become a Host",  path: "/host" },
  { label: "Policies",       path: "/responsible-hosting" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function getInitials(user) {
  if (!user) return "";
  return (user.name || user.email || "").charAt(0).toUpperCase();
}

// ─── SVG icons ──────────────────────────────────────────────────────────────
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

// ─── Drop panel ─────────────────────────────────────────────────────────────
function DropPanel({ children, className = "", style }) {
  return (
    <div
      style={style}
      className={`absolute top-full bg-white shadow-xl rounded-2xl border border-[#E8D9B8] z-50 ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Mega menu column (desktop) ─────────────────────────────────────────────
function MegaGrid({ items, onClose }) {
  return (
    <div className="flex flex-col">
      {items.map((item) => (
        <Link
          key={item.href}
          to={item.href}
          onClick={onClose}
          className="block px-4 py-2.5 text-sm text-[#3D2B1A] hover:bg-[#FAF6EF] hover:text-[#C4622D] transition-colors"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

// ─── Navbar ─────────────────────────────────────────────────────────────────
export default function Navbar() {
  const location = useLocation();
  const {
    user, logout, cartCount,
    availableCountries,
    selectedCountry, setSelectedCountry,
  } = useContext(AppContext);

  const savedScrollY = useRef(0);
  const [isOpen, setIsOpen]               = useState(false);
  const [expandedSection, setExpandedSection] = useState(null);
  const [openMenu, setOpenMenu]           = useState(null);

  const handleCountryChange = (countryObj) => {
    setSelectedCountry(countryObj);
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

  // ─── Desktop dropdown wrapper ──────────────────────────────────────────────
  function DesktopMenu({ menuKey, label, path = "", children, minWidth = 480 }) {
    return (
      <div
        className="relative"
        onMouseEnter={() => setOpenMenu(menuKey)}
        onMouseLeave={() => setOpenMenu(null)}
      >
        <button className={navLinkClass(path)}>
          {label} <ChevronDown open={openMenu === menuKey} />
        </button>
        {openMenu === menuKey && (
          <DropPanel className="left-0 p-4 mt-0.5" style={{ minWidth }}>
            {children}
          </DropPanel>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ─── Desktop nav bar ───────────────────────────────────────────────── */}
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
              {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : "🌍 Kenya"}
              <ChevronDown open={openMenu === "country"} />
            </button>
            {openMenu === "country" && (
              <DropPanel className="left-0 w-44 py-1 mt-0.5">
                <button
                  onClick={() => handleCountryChange(null)}
                  className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#FAF6EF] ${
                    !selectedCountry ? "text-[#C4622D] font-semibold" : "text-[#3D2B1A]"
                  }`}
                >
                  🌍 All Africa
                </button>
                {availableCountries.map((c) => (
                  <button
                    key={c.code}
                    onClick={() => handleCountryChange(c)}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-[#FAF6EF] ${
                      selectedCountry?.code === c.code ? "text-[#C4622D] font-semibold" : "text-[#3D2B1A]"
                    }`}
                  >
                    {c.flag} {c.name}
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
            <StarIcon /> Plan Trip
          </Link>

          {/* Adventures */}
          <DesktopMenu menuKey="adventures" label="Adventures" path="/search?type=adventure" minWidth={380}>
            <p className="text-[10px] uppercase tracking-widest text-[#5C4230] font-semibold mb-3 px-1">
              Experiences & Activities
            </p>
            <MegaGrid items={ADVENTURES_ITEMS} onClose={() => setOpenMenu(null)} />
            <div className="mt-3 pt-3 border-t border-[#E8D9B8]">
              <Link
                to="/search?type=adventure"
                onClick={() => setOpenMenu(null)}
                className="block text-center text-xs text-[#C4622D] font-semibold hover:underline"
              >
                View all adventures →
              </Link>
            </div>
          </DesktopMenu>

          {/* Stays */}
          <DesktopMenu menuKey="stays" label="Stays" path="/search?type=accommodation" minWidth={340}>
            <p className="text-[10px] uppercase tracking-widest text-[#5C4230] font-semibold mb-3 px-1">
              Accommodation
            </p>
            <MegaGrid items={STAYS_ITEMS} onClose={() => setOpenMenu(null)} />
            <div className="mt-3 pt-3 border-t border-[#E8D9B8]">
              <Link
                to="/search?type=accommodation"
                onClick={() => setOpenMenu(null)}
                className="block text-center text-xs text-[#C4622D] font-semibold hover:underline"
              >
                View all stays →
              </Link>
            </div>
          </DesktopMenu>

          {/* Transport */}
          <DesktopMenu menuKey="transport" label="Transport" path="/search?type=transport" minWidth={360}>
            <p className="text-[10px] uppercase tracking-widest text-[#5C4230] font-semibold mb-3 px-1">
              Getting Around
            </p>
            <MegaGrid items={TRANSPORT_ITEMS} onClose={() => setOpenMenu(null)} />
            <div className="mt-3 pt-3 border-t border-[#E8D9B8]">
              <Link
                to="/search?type=transport"
                onClick={() => setOpenMenu(null)}
                className="block text-center text-xs text-[#C4622D] font-semibold hover:underline"
              >
                View all transport →
              </Link>
            </div>
          </DesktopMenu>

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

        {/* Right side — cart + profile */}
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

              {/* Profile dropdown */}
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
                      { to: "/profile",  label: "Profile" },
                      { to: "/bookings", label: "My Bookings" },
                      { to: "/settings", label: "Settings" },
                    ].map(({ to, label }) => (
                      <Link key={to} to={to} onClick={() => setOpenMenu(null)}
                        className="block px-4 py-2 text-sm text-[#3D2B1A] hover:bg-[#FAF6EF] hover:text-[#C4622D] transition-colors">
                        {label}
                      </Link>
                    ))}

                    {user.role === "host" && (
                      <Link to="/host/dashboard" onClick={() => setOpenMenu(null)}
                        className="block px-4 py-2 text-sm text-[#3D2B1A] hover:bg-[#FAF6EF] hover:text-[#C4622D] transition-colors">
                        Host Dashboard
                      </Link>
                    )}

                    {user.role === "admin" && (
                      <>
                        <div className="px-4 pt-2 pb-0.5 text-[10px] uppercase tracking-widest text-[#5C4230] font-semibold">Admin</div>
                        {[
                          { to: "/admin",           label: "Dashboard" },
                          { to: "/admin/users",     label: "Manage Users" },
                          { to: "/admin/approvals", label: "Approvals" },
                          { to: "/admin/careers",   label: "Manage Careers" },
                        ].map(({ to, label }) => (
                          <Link key={to} to={to} onClick={() => setOpenMenu(null)}
                            className="block px-4 py-2 text-sm text-[#3D2B1A] hover:bg-[#FAF6EF] hover:text-[#C4622D] transition-colors">
                            {label}
                          </Link>
                        ))}
                      </>
                    )}

                    <div className="border-t border-[#E8D9B8] mt-1" />
                    <button
                      onClick={() => { logout(); setOpenMenu(null); }}
                      className="w-full text-left block px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                    >
                      Logout
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

      {/* ─── Mobile menu ───────────────────────────────────────────────────── */}
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
            { key: "adventures", label: "Adventures", items: ADVENTURES_ITEMS },
            { key: "stays",      label: "Stays",      items: STAYS_ITEMS },
            { key: "transport",  label: "Transport",  items: TRANSPORT_ITEMS },
          ].map(({ key, label, items }) => (
            <div key={key} className="border-b border-[#E8D9B8]">
              <button
                onClick={() => toggleSection(key)}
                className="w-full flex items-center justify-between py-3 text-[14px] font-medium text-[#5C4230]"
              >
                {label}
                <ChevronDown open={expandedSection === key} />
              </button>
              {expandedSection === key && (
                <div className="pb-2 flex flex-col">
                  {items.map((item) => (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={navigateFromMenu}
                      className="block px-3 py-2.5 text-sm text-[#3D2B1A] hover:bg-[#E8D9B8] rounded-lg"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Country selector */}
          {availableCountries.length > 0 && (
            <div className="border-b border-[#E8D9B8]">
              <button
                onClick={() => toggleSection("country")}
                className="w-full flex items-center justify-between py-3 text-[14px] font-medium text-[#5C4230]"
              >
                <span className="flex items-center gap-2">
                  <GlobeIcon />
                  {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : "🌍 All Africa"}
                </span>
                <ChevronDown open={expandedSection === "country"} />
              </button>
              {expandedSection === "country" && (
                <div className="pb-2">
                  <button
                    onClick={() => { handleCountryChange(null); setExpandedSection(null); }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-lg ${
                      !selectedCountry ? "text-[#C4622D] font-semibold" : "text-[#3D2B1A] hover:bg-[#E8D9B8]"
                    }`}
                  >
                    🌍 All Africa
                  </button>
                  {availableCountries.map((c) => (
                    <button
                      key={c.code}
                      onClick={() => { handleCountryChange(c); setExpandedSection(null); }}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg ${
                        selectedCountry?.code === c.code ? "text-[#C4622D] font-semibold" : "text-[#3D2B1A] hover:bg-[#E8D9B8]"
                      }`}
                    >
                      {c.flag} {c.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cart link */}
          <Link to="/cart" onClick={navigateFromMenu}
            className="flex items-center justify-between py-3 border-b border-[#E8D9B8] text-[14px] font-medium text-[#5C4230] hover:text-[#C4622D]">
            <span className="flex items-center gap-2"><CartIcon /> Cart</span>
            {cartCount > 0 && (
              <span className="bg-[#C4622D] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          {/* Auth section */}
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
                  { to: "/profile",  label: "Profile" },
                  { to: "/bookings", label: "My Bookings" },
                  { to: "/settings", label: "Settings" },
                ].map(({ to, label }) => (
                  <Link key={to} to={to} onClick={navigateFromMenu}
                    className="block py-2 text-[14px] text-[#5C4230] hover:text-[#C4622D]">
                    {label}
                  </Link>
                ))}

                {user.role === "host" && (
                  <Link to="/host/dashboard" onClick={navigateFromMenu}
                    className="block py-2 text-[14px] text-[#5C4230] hover:text-[#C4622D]">
                    Host Dashboard
                  </Link>
                )}

                {user.role === "admin" && (
                  <>
                    <Link to="/admin" onClick={navigateFromMenu} className="block py-2 text-[14px] text-[#5C4230] hover:text-[#C4622D]">Admin Dashboard</Link>
                    <Link to="/admin/users" onClick={navigateFromMenu} className="block py-2 text-[14px] text-[#5C4230] hover:text-[#C4622D]">Manage Users</Link>
                    <Link to="/admin/approvals" onClick={navigateFromMenu} className="block py-2 text-[14px] text-[#5C4230] hover:text-[#C4622D]">Approvals</Link>
                  </>
                )}

                <button onClick={() => { logout(); navigateFromMenu(); }}
                  className="block py-2 text-[14px] text-red-500 text-left">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
