import { useState, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import logo from "../assets/afristay svg.svg";

function getInitials(user) {
  if (!user) return "";
  const name = user.name || user.email || "";
  return name.charAt(0).toUpperCase();
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const { user, logout } = useContext(AppContext);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const navLinks = [
    { name: "Explore", path: "/" },
    { name: "Safari Lodges", path: "/search?category=safari" },
    { name: "Beach Escapes", path: "/search?category=beach" },
    { name: "City Stays", path: "/search?category=city" },
    ...(user?.role !== "admin" ? [{ name: "Become a Host", path: "/host" }] : []),
  ];

  return (
    <nav className="sticky top-0 z-50 bg-[#FAF6EF] border-b border-[#E8D9B8] px-4 md:px-10 flex items-center justify-between h-[68px]">

      {/* Logo */}
      <Link to="/" className="flex items-center gap-2 md:gap-4">
        <img src={logo} alt="AfriStay Logo" className="w-6 h-6" />
        <div className="font-serif font-bold text-[22px] text-[#3D2B1A]">
          Afri<span className="text-[#C4622D]">Stay</span>
        </div>
      </Link>

      {/* Desktop Links */}
      <div className="hidden md:flex items-center gap-[28px]">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className="text-[14px] font-medium text-[#5C4230] hover:text-[#C4622D] px-3 py-2"
          >
            {link.name}
          </Link>
        ))}
      </div>

      {/* Auth Section */}
      <div className="hidden md:flex items-center gap-3 relative">
        {!user ? (
          <>
            <Link
              to="/login"
              className="border border-[#3D2B1A] px-5 py-2 rounded-full text-[14px]"
            >
              Sign In
            </Link>

            <Link
              to="/register"
              className="bg-[#C4622D] text-white px-5 py-2 rounded-full text-[14px]"
            >
              Get Started
            </Link>
          </>
        ) : (
          <>
            {/* Avatar */}
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#C4622D] text-white font-semibold cursor-pointer"
            >
              {getInitials(user)}
            </div>

            {/* Dropdown */}
            {showDropdown && (
              <div ref={dropdownRef} className="absolute right-0 top-12 w-56 bg-white shadow-lg rounded-xl border py-2 z-60">

                <Link to="/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>
                  <span>👤</span>
                  Profile
                </Link>

                <Link to="/bookings" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>
                  <span>🗓️</span>
                  My Bookings
                </Link>

                <Link to="/settings" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>
                  <span>⚙️</span>
                  Settings
                </Link>

                {user.role === "host" && (
                  <Link to="/host/dashboard" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>
                    <span>🏠</span>
                    Host Dashboard
                  </Link>
                )}

                {user.role === "admin" && (
                  <>
                    <div className="px-4 py-1 text-[10px] uppercase tracking-widest text-gray-400 font-semibold">Admin</div>
                    <Link to="/admin" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>
                      <span>📊</span>
                      Dashboard
                    </Link>
                    <Link to="/admin/users" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>
                      <span>👥</span>
                      Manage Users
                    </Link>
                    <Link to="/admin/approvals" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>
                      <span>✅</span>
                      Approvals
                    </Link>
                    <Link to="/admin/careers" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>
                      <span>💼</span>
                      Manage Careers
                    </Link>
                  </>
                )}

                {user.role === "user" && (
                  <Link to="/dashboard" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100" onClick={() => setShowDropdown(false)}>
                    <span>📊</span>
                    My Dashboard
                  </Link>
                )}

                <div className="border-t my-2"></div>

                <button
                  onClick={() => {
                    logout();
                    setShowDropdown(false);
                  }}
                  className="w-full text-left flex items-center gap-2 px-4 py-2 hover:bg-gray-100 text-red-500"
                >
                  <span>🚪</span>
                  Logout
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Mobile Toggle */}
      <div className="md:hidden">
        <button onClick={() => setIsOpen(!isOpen)}>
          <svg className="w-6 h-6 text-[#3D2B1A]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

    </nav>
  );
}