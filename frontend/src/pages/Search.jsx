import { useContext } from "react";
import { AppContext } from "../context/AppContext";
import ListingCard from "../components/ListingCard";

export default function Search() {
  const { searchResults, searchQuery } = useContext(AppContext);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold mb-6">
        Results for "{searchQuery}"
      </h1>

      {searchResults.length === 0 ? (
        <p>No results found</p>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          {searchResults.map((item) => (
            <ListingCard key={item.id} listing={item} />
          ))}
        </div>
      )}
    </div>
  );
}