import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { AppContext } from "../context/AppContext";

export default function Hero() {
  const { listings, user } = useContext(AppContext);
  const [currentImage, setCurrentImage] = useState(0);
  const [loadedImages, setLoadedImages] = useState([]);

  useEffect(() => {
    if (!listings || listings.length === 0) return;
    const images = listings.map(l => l.images?.[0]).filter(Boolean);
    let isMounted = true;
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
      img.onload = () => { if (isMounted) setLoadedImages(prev => [...prev, src]); };
    });
    return () => { isMounted = false; };
  }, [listings]);

  useEffect(() => {
    if (loadedImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImage(prev => (prev + 1) % loadedImages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [loadedImages]);

  if (loadedImages.length === 0) {
    return <section className="min-h-[50vh] bg-gray-800" />;
  }

  return (
    <section className="relative min-h-[50vh] flex items-center overflow-hidden pb-10">
      {/* Image carousel */}
      {loadedImages.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${index === currentImage ? "opacity-100" : "opacity-0"}`}
          style={{ backgroundImage: `url(${img})`, backgroundSize: "cover", backgroundPosition: "center" }}
        />
      ))}

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/55" />

      {/* Content */}
      <div className="relative z-10 px-6 md:px-12 max-w-[620px]">
        <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-3">
          Africa's #1 Accommodation Marketplace
        </p>
        <h1 className="text-white text-3xl md:text-5xl font-bold leading-tight mb-3">
          Discover authentic stays across Africa
        </h1>
        <p className="text-white/80 text-sm md:text-base leading-relaxed mb-5 max-w-md">
          From safari lodges in the Maasai Mara to beachfront villas in Zanzibar — book unique African experiences with local hosts, pay your way, and travel with confidence.
        </p>
        <div className="flex flex-wrap gap-3 mb-6">
          <Link to="/search" className="bg-[#C4622D] text-white px-5 py-2 rounded-full text-sm font-semibold hover:bg-[#a8521f] transition-colors">
            Explore stays
          </Link>
          {user?.role !== "admin" && (
            <Link to="/host" className="bg-white/20 backdrop-blur text-white px-5 py-2 rounded-full text-sm border border-white/30 hover:bg-white/30 transition-colors">
              Become a host
            </Link>
          )}
        </div>
        <div className="flex flex-wrap gap-6 text-white">
          <div>
            <div className="text-xl font-bold">2,400+</div>
            <div className="text-white/60 text-xs">Unique stays</div>
          </div>
          <div>
            <div className="text-xl font-bold">8 cities</div>
            <div className="text-white/60 text-xs">Across East Africa</div>
          </div>
          <div>
            <div className="text-sm font-bold leading-snug">M-Pesa · Airtel · Visa</div>
            <div className="text-white/60 text-xs">3 payment methods</div>
          </div>
        </div>
      </div>
    </section>
  );
}
