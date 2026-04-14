import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import { BookingCard } from "../components/BookingCard";
import { getListingById } from "../utils/getListing";

export default function ListingDetail() {
  const { id } = useParams();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        const data = await getListingById(id);
        if (data) {
          setListing(data);
        } else {
          setError("Listing not found");
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id]);

  if (loading) {
    return (
      <div>
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl">Loading listing...</div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div>
       
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-xl text-red-600">
            {error || "Listing not found"}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
     
      <div className="grid grid-cols-3 gap-6 p-10">
        <div className="col-span-2">
          <div className="h-72 bg-gray-300 mb-4">
            {listing.images && listing.images.length > 0 && (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            )}
          </div>
          <h1 className="text-2xl font-bold">{listing.title}</h1>
          <p className="mt-4 text-gray-600">{listing.description}</p>
          <div className="mt-4">
            <p><strong>Location:</strong> {listing.location}</p>
            <p><strong>Price:</strong> ${listing.price}/night</p>
            <p><strong>Rating:</strong> {listing.rating} ({listing.reviews} reviews)</p>
            {listing.amenities && (
              <p><strong>Amenities:</strong> {listing.amenities.join(", ")}</p>
            )}
          </div>
        </div>
        <BookingCard />
      </div>
    </div>
  );
}