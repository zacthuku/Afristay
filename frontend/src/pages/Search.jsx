import { useContext, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import ListingCard from "../components/ListingCard";

const CATEGORY_LABELS = {
  safari: "Safari Lodges",
  beach: "Beach Villas",
  city: "City Stays",
  weekend: "Weekend Escapes",
};

export default function Search() {
  const [searchParams] = useSearchParams();
  const { searchResults, searchQuery, handleSearch, listings } = useContext(AppContext);

  const category = searchParams.get("category") || "";
  const queryParam = searchParams.get("q") || "";

  useEffect(() => {
    handleSearch({ query: queryParam, category });
  }, [category, queryParam, listings, handleSearch]);

  const heading = category
    ? (CATEGORY_LABELS[category] || category)
    : searchQuery
    ? `Results for "${searchQuery}"`
    : "All Stays";

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-bold text-[#3D2B1A] mb-2">{heading}</h1>
        <p className="text-gray-500 mb-8">
          {searchResults.length} stay{searchResults.length !== 1 ? "s" : ""} found
        </p>

        {searchResults.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No stays found.</p>
            <p className="text-gray-300 text-sm mt-2">Try a different search or category.</p>
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
