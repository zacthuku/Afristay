import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export default function Header() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: "🏠 Home", path: "/" },
    { name: "🔍 Search Results", path: "/search" },
    { name: "🏡 Listing Detail", path: "/listing" },
    { name: "💳 Checkout", path: "/checkout" },
    { name: "📊 Host Dashboard", path: "/dashboard" },
  ];

  return (
    <header className="bg-white shadow-md px-4 md:px-10 py-4 sticky top-0 z-50">
      <div className="flex justify-between items-center">
        {/* Logo */}
        

        {/* Desktop Links */}
        <ul className="hidden md:flex justify-center items-center gap-4 md:gap-8">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`px-3 py-2 rounded-lg transition-all duration-200
                    ${isActive ? "bg-[#C4622D] text-white" : "text-gray-700 hover:bg-gray-100"}
                  `}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

        

        {/* Hamburger for mobile */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="focus:outline-none">
            <svg
              className="w-6 h-6 text-[#3D2B1A]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-[500px] py-4" : "max-h-0"
        }`}
      >
        <ul className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`block px-3 py-2 rounded-lg transition-all duration-200
                    ${isActive ? "bg-[#C4622D] text-white" : "text-gray-700 hover:bg-gray-100"}
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            );
          })}
        </ul>

       
      </div>
    </header>
  );
}