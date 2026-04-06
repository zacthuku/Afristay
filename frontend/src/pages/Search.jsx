import Navbar from "../components/Navbar";
import ListingCard from "../components/ListingCard";

export default function Search() {
  const listings = [
    { id: 1, title: "Safari Lodge", location: "Mara", price: 120, rating: 4.8 },
    { id: 2, title: "City Apartment", location: "Nairobi", price: 70, rating: 4.5 },
  ];

  return (
    <div>
      
      <div className="flex">
        <aside className="w-64 p-4 border-r space-y-4">
          <h3 className="font-semibold">Filters</h3>
          <input className="w-full border p-2" placeholder="Max Price" />
          <select className="w-full border p-2">
            <option>All Types</option>
            <option>Safari</option>
            <option>Beach</option>
          </select>
        </aside>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} />
          ))}
        </div>
      </div>
    </div>
  );
}

// =========================