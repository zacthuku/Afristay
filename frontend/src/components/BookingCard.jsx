export function BookingCard() {
  return (
    <div className="border p-6 rounded-xl shadow-lg sticky top-20">
      <h2 className="text-xl font-semibold mb-4">Book this stay</h2>
      <input type="date" className="w-full border p-2 mb-3" />
      <input type="date" className="w-full border p-2 mb-3" />
      <button className="w-full bg-clay text-white py-2 rounded-lg">
        Reserve
      </button>
    </div>
  );
}