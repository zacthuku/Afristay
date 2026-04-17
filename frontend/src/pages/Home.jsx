import { useContext } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Footer from "../components/Footer";
import ListingCard from "../components/ListingCard"; // default import
import { SearchBar } from "../components/SearchBar";
import { AppContext } from "../context/AppContext";

const categories = [
  { name: "Safari", icon: "🦁", slug: "safari" },
  { name: "Beach", icon: "🏖️", slug: "beach" },
  { name: "City Stays", icon: "🏙️", slug: "city" },
  { name: "Weekend Getaways", icon: "🌄", slug: "weekend" },
];

export default function Home() {
  const { listings, loading, error } = useContext(AppContext);

  // Sort listings by rating descending (highest first)
  const sortedListings = [...listings].sort((a, b) => b.rating - a.rating);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl">Loading listings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-xl text-red-600">Error loading listings: {error}</div>
      </div>
    );
  }

  return (
    <div className="bg-cream min-h-screen flex flex-col">
      <Hero />
      <SearchBar />

      {/* Categories */}
      <section className="w-full py-12">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <h2 className="text-2xl font-semibold mb-6">Explore by category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((cat, index) => (
              <Link
                key={index}
                to={`/search?category=${cat.slug}`}
                className="border rounded-xl p-6 text-center hover:shadow-md bg-white cursor-pointer transition-shadow block"
              >
                <div className="text-3xl mb-2">{cat.icon}</div>
                <p className="font-medium text-[#3D2B1A]">{cat.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Listings */}
      <section className="w-full pb-16">
        <div className="max-w-[1280px] mx-auto px-4 md:px-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Featured stays</h2>
            <button className="text-clay font-medium">View all</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sortedListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </div>
      </section>

      
    </div>
  );
}