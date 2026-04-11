import { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../assets/afristay svg.svg";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { name: "Explore", path: "/" },
    { name: "Safari Lodges", path: "/safari" },
    { name: "Beach Escapes", path: "/beach" },
    { name: "Experiences", path: "/experiences" },
    { name: "Become a Host", path: "/host" },
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

      {/* Desktop CTA Buttons */}
      <div className="hidden md:flex items-center gap-2">
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
      </div>

      {/* Mobile Menu Toggle */}
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

      {/* Mobile Menu */}
      <div className={`md:hidden absolute top-[68px] left-0 w-full bg-[#FAF6EF] transition-all duration-300 ${
        isOpen ? "max-h-[500px] py-4" : "max-h-0 overflow-hidden"
      }`}>
        <ul className="flex flex-col gap-2 px-4">
          {navLinks.map((link) => (
            <li key={link.name}>
              <Link
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block text-[14px] font-medium text-[#5C4230] hover:text-[#C4622D] px-3 py-2"
              >
                {link.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2 px-4 mt-4">
          <Link
            to="/login"
            onClick={() => setIsOpen(false)}
            className="border border-[#3D2B1A] py-2 rounded-full text-[14px] text-center"
          >
            Sign In
          </Link>

          <Link
            to="/register"
            onClick={() => setIsOpen(false)}
            className="bg-[#C4622D] text-white py-2 rounded-full text-[14px] text-center"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}