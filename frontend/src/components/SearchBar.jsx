export function SearchBar() {
  return (
    <div className="bg-white rounded-full shadow-lg p-2 flex items-center gap-2 max-w-md w-full">
      <input
        type="text"
        placeholder="Where are you going?"
        className="flex-1 px-4 py-2 rounded-full outline-none"
      />
      <button className="bg-clay text-white px-6 py-2 rounded-full font-medium">
        Search
      </button>
    </div>
  );
}