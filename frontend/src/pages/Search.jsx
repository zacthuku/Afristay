import { useContext, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import ListingCard from "../components/ListingCard";

const TYPE_LABELS = {
  accommodation: "Stays",
  transport: "Transport",
  attraction: "Attractions",
  restaurant: "Restaurants",
  experience: "Experiences",
  tour: "Tours",
  adventure: "Adventures",
  wellness: "Wellness",
  event: "Events",
  cruise: "Cruises",
};

export default function Search() {
  const [searchParams] = useSearchParams();
  const { searchResults, loading, handleSearch } = useContext(AppContext);

  const category = searchParams.get("category") || "";
  const typeParam = searchParams.get("type") || "";
  const queryParam = searchParams.get("q") || "";

  // Track previous params to avoid infinite re-fetch loops
  const prevKey = useRef("");
  const currentKey = `${typeParam}|${queryParam}|${category}`;

  useEffect(() => {
    if (prevKey.current === currentKey) return;
    prevKey.current = currentKey;
    handleSearch({ type: typeParam, query: queryParam, category });
  }, [currentKey, typeParam, queryParam, category, handleSearch]);

  const heading = typeParam
    ? TYPE_LABELS[typeParam] || typeParam
    : queryParam
    ? `Results for "${queryParam}"`
    : category
    ? category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "All Listings";

  const subheading = typeParam && queryParam
    ? `Filtered by "${queryParam}" in ${TYPE_LABELS[typeParam] || typeParam}`
    : null;

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-[#3D2B1A] mb-1">{heading}</h1>
        {subheading && (
          <p className="text-[#C4622D] text-sm mb-1">{subheading}</p>
        )}
        <p className="text-gray-500 text-sm mb-8">
          {loading
            ? "Searching…"
            : `${searchResults.length} listing${searchResults.length !== 1 ? "s" : ""} found`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : searchResults.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No listings found.</p>
            <p className="text-gray-300 text-sm mt-2">
              Try a different search or{" "}
              <Link to="/search" className="text-[#C4622D] hover:underline">
                view all listings
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {searchResults.map((item) => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
