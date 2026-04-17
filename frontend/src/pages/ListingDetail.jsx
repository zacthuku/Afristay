import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";

import { BookingCard } from "../components/BookingCard";
import ReviewSection from "../components/ReviewSection";
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-[#3D2B1A]">Loading listing...</div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-600">{error || "Listing not found"}</div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF6EF] min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left column — listing details */}
        <div className="lg:col-span-2">
          {/* Image */}
          <div className="h-80 bg-gray-200 rounded-2xl overflow-hidden mb-6">
            {listing.images && listing.images.length > 0 ? (
              <img
                src={listing.images[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image available
              </div>
            )}
          </div>

          {/* Title & meta */}
          <h1 className="text-3xl font-bold text-[#3D2B1A] mb-2">{listing.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            {listing.location && <span>📍 {listing.location}</span>}
            {listing.rating && (
              <span>⭐ {listing.rating} ({listing.reviews || 0} reviews)</span>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-700 leading-relaxed mb-6">{listing.description}</p>

          {/* Amenities */}
          {listing.amenities && listing.amenities.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-[#3D2B1A] mb-3">Amenities</h2>
              <div className="flex flex-wrap gap-2">
                {listing.amenities.map((amenity, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 bg-[#E8D9B8] text-[#3D2B1A] rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <ReviewSection serviceId={id} />
        </div>

        {/* Right column — booking */}
        <div className="lg:col-span-1">
          <BookingCard listing={listing} />
        </div>
      </div>
    </div>
  );
}
