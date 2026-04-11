import { useEffect, useState } from "react";
import listings from "../data/listings";
import { SearchBar } from "../components/SearchBar";

// Extract hero images (only first image of each listing)
const heroImages = listings.map(listing => listing.images[0]).filter(Boolean);

export default function Hero() {
  const [currentImage, setCurrentImage] = useState(0);
  const [loadedImages, setLoadedImages] = useState([]);

  // Preload images
  useEffect(() => {
    let isMounted = true;
    heroImages.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        if (!isMounted) return;
        setLoadedImages(prev => [...prev, src]);
      };
      img.onerror = () => console.warn(`Image failed to load: ${src}`);
    });
    return () => { isMounted = false; };
  }, []);

  // Rotate images every 5s
  useEffect(() => {
    if (loadedImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % loadedImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadedImages]);

  if (loadedImages.length === 0) {
    return (
      <section className="min-h-[90vh] flex items-center justify-center bg-gray-800 text-white">
        Loading...
      </section>
    );
  }

  return (
    <section className="relative min-h-[90vh] flex flex-col justify-center overflow-hidden">
      {/* Image carousel */}
      {loadedImages.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImage ? "opacity-100" : "opacity-0"
          }`}
          style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50"></div>

      {/* Content */}
      <div className="relative z-10 px-6 md:px-12 max-w-[700px] text-left">
        <p className="text-white/80 mb-4 text-sm md:text-base">
          Africa's #1 Accommodation Marketplace
        </p>
        <h1 className="text-white text-4xl md:text-6xl font-bold leading-tight mb-6">
          Discover authentic stays across Africa
        </h1>
        <p className="text-white/70 text-base md:text-lg mb-8 max-w-[550px]">
          From Nairobi city apartments to Maasai Mara safari lodges, Diani beachfront villas to Nanyuki mountain escapes — book with M-Pesa in seconds.
        </p>
        <div className="flex flex-wrap gap-4 mb-12">
          <button className="bg-[#C4622D] text-white px-6 py-3 rounded-full">
            Explore stays
          </button>
          <button className="bg-white/20 backdrop-blur text-white px-6 py-3 rounded-full border border-white/30">
            Become a host
          </button>
        </div>
        <div className="flex flex-wrap gap-10 text-white mb-12">
          <div>
            <div className="text-3xl font-bold">2,400+</div>
            <div className="text-white/60 text-sm">Unique stays</div>
          </div>
          <div>
            <div className="text-3xl font-bold">8 cities</div>
            <div className="text-white/60 text-sm">Across East Africa</div>
          </div>
          <div>
            <div className="text-3xl font-bold">M-Pesa</div>
            <div className="text-white/60 text-sm">Native payments</div>
          </div>
        </div>
      </div>

      {/* Smart SearchBar resting halfway at bottom of hero */}
      <div className="absolute left-1/2 transform -translate-x-1/2 bottom-[-50px] w-full px-4 z-20">
        
      </div>
    </section>
  );
}