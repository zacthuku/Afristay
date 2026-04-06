export default function Footer() {
  return (
    <footer className="bg-[#FAF6EF] text-black px-4 md:px-10 py-12">
      
      {/* Top Section */}
      <div className="flex flex-wrap md:flex-nowrap justify-between gap-8">
        
        {/* Brand */}
        <div className="min-w-[200px] flex-1">
          <h2 className="text-xl font-bold mb-3">
            Afri<span className="text-[#C4622D]">Stay</span>
          </h2>
          <p className="text-black/60 text-sm">
            Africa's most authentic accommodation marketplace. Connecting travelers to extraordinary stays across the continent.
          </p>
        </div>

        {/* Explore */}
        <div className="min-w-[150px]">
          <h3 className="mb-3 font-semibold">Explore</h3>
          <ul className="space-y-2 text-black/70 text-sm">
            <li>City Stays</li>
            <li>Beach villas</li>
            <li>Safari lodges</li>
            <li>Unique homes</li>
            <li>Weekend escapes</li>
          </ul>
        </div>

        {/* Hosting */}
        <div className="min-w-[150px]">
          <h3 className="mb-3 font-semibold">Hosting</h3>
          <ul className="space-y-2 text-black/70 text-sm">
            <li>Become a host</li>
            <li>Host resources</li>
            <li>Community</li>
            <li>Responsible hosting</li>
          </ul>
        </div>

        {/* Company */}
        <div className="min-w-[150px]">
          <h3 className="mb-3 font-semibold">Company</h3>
          <ul className="space-y-2 text-black/70 text-sm">
            <li>About Us</li>
            <li>Careers</li>
            <li>Press</li>
            <li>Contact</li>
          </ul>
        </div>

      </div>

      {/* Bottom Section */}
      <div className="mt-10 border-t border-black pt-4 text-center text-sm text-black">
        © {new Date().getFullYear()} AfriStay Ltd. Nairobi, Kenya.
      </div>
    </footer>
  );
}