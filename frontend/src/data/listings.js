const listings = [
  {
    id: 1,
    title: "Luxury Safari Lodge",
    location: "Maasai Mara, Kenya",
    price: 120,
    rating: 4.9,
    reviews: 128,
    description:
      "Experience the wild in ultimate comfort. This luxury lodge offers breathtaking savannah views, guided safaris, and premium amenities.",
    
    host: {
      name: "Daniel Mwangi",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      superhost: true,
    },

    amenities: [
      "WiFi",
      "Pool",
      "Game Drives",
      "Air Conditioning",
      "Breakfast Included",
    ],

    images: [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      "https://images.unsplash.com/photo-1519821172141-b5d8d0f6c3f5",
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
    ],

    adventures: [
      {
        title: "Sunset Game Drive",
        image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
      },
      {
        title: "Hot Air Balloon Safari",
        image: "https://images.unsplash.com/photo-1504198458649-3128b932f49b",
      },
    ],
  },

  {
    id: 2,
    title: "Oceanfront Villa",
    location: "Diani Beach, Kenya",
    price: 95,
    rating: 4.8,
    reviews: 89,
    description:
      "Wake up to ocean views in this stunning beachfront villa. Perfect for relaxation and water adventures.",

    host: {
      name: "Amina Hassan",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      superhost: true,
    },

    amenities: [
      "Beach Access",
      "WiFi",
      "Private Pool",
      "Kitchen",
      "Free Parking",
    ],

    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
      "https://images.unsplash.com/photo-1501117716987-c8e1ecb210c1",
      "https://images.unsplash.com/photo-1505691938895-1758d7feb511",
    ],

    adventures: [
      {
        title: "Snorkeling",
        image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      },
      {
        title: "Jet Skiing",
        image: "https://images.unsplash.com/photo-1504609813442-a8924e83f76e",
      },
    ],
  },

  {
    id: 3,
    title: "Modern City Apartment",
    location: "Nairobi, Kenya",
    price: 60,
    rating: 4.6,
    reviews: 54,
    description:
      "A stylish apartment in the heart of Nairobi. Ideal for business and urban exploration.",

    host: {
      name: "Brian Otieno",
      avatar: "https://randomuser.me/api/portraits/men/65.jpg",
      superhost: false,
    },

    amenities: [
      "WiFi",
      "Workspace",
      "Gym",
      "Security",
      "Elevator",
    ],

    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
      "https://images.unsplash.com/photo-1494526585095-c41746248156",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    ],

    adventures: [
      {
        title: "City Tour",
        image: "https://images.unsplash.com/photo-1508057198894-247b23fe5ade",
      },
      {
        title: "Food Experience",
        image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836",
      },
    ],
  },
];

export default listings;