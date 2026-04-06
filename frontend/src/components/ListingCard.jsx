// Default export for easier import
export default function ListingCard({ listing }) {
  if (!listing) return null;

  const { title, location, price, rating, reviews, images, host, amenities } = listing;

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col hover:shadow-xl transition-shadow duration-300">
      
      {/* Image */}
      <div className="w-full h-48 md:h-60 relative">
        <img
          src={images?.[0]}
          alt={title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        
        <div>
          <h3 className="text-lg font-semibold mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mb-2">{location}</p>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 text-yellow-500">
              <span>★</span>
              <span className="font-medium">{rating}</span>
              <span className="text-gray-400 text-sm">({reviews})</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">${price}/night</div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-2">
            {amenities?.slice(0, 3).map((amenity, i) => (
              <span key={i} className="px-2 py-1 bg-gray-100 rounded-md">
                {amenity}
              </span>
            ))}
          </div>
        </div>

        {/* Host */}
        {host && (
          <div className="flex items-center gap-2 mt-4">
            <img
              src={host.avatar}
              alt={host.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <span className="text-sm font-medium">{host.name}</span>
            {host.superhost && (
              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                Superhost
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}