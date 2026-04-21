import { Link } from "react-router-dom";

export default function ListingCard({ listing }) {
  if (!listing) return null;

  const { title, location, price, rating, reviews, images, amenities } = listing;

  return (
    <Link to={`/listing/${listing.id}`} className="block group">
      <div className="bg-white rounded-xl border border-[#E8D9B8] overflow-hidden hover:shadow-md transition-shadow duration-200">

        {/* Image */}
        <div className="w-full h-40 overflow-hidden">
          <img
            src={images?.[0]}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        </div>

        {/* Content */}
        <div className="p-3">
          <h3 className="text-sm font-semibold text-[#3D2B1A] truncate mb-0.5">{title}</h3>
          <p className="text-xs text-[#5C4230] mb-2 truncate">{location}</p>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-yellow-500 text-xs">
              <span>★</span>
              <span className="font-medium text-[#3D2B1A]">{rating}</span>
              <span className="text-[#5C4230]/50">({reviews})</span>
            </div>
            <div className="text-xs font-semibold text-[#3D2B1A]">${price}<span className="text-[#5C4230]/60 font-normal">/night</span></div>
          </div>

          {amenities?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {amenities.slice(0, 3).map((a, i) => (
                <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#FAF6EF] text-[#5C4230] rounded-md border border-[#E8D9B8]">
                  {a}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
