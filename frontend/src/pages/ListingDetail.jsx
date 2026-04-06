import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { BookingCard } from "../components/BookingCard";

export function ListingDetail() {
  const { id } = useParams();

  return (
    <div>
      
      <div className="grid grid-cols-3 gap-6 p-10">
        <div className="col-span-2">
          <div className="h-72 bg-gray-300 mb-4"></div>
          <h1 className="text-2xl font-bold">Listing {id}</h1>
          <p className="mt-4 text-gray-600">
            Beautiful stay in a prime location. Fully furnished and perfect for
            travelers.
          </p>
        </div>
        <BookingCard />
      </div>
    </div>
  );
}