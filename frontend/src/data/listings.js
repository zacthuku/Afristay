// listings.js
const listings = [
  {
    id: 1,
    title: "Maasai Mara Safari Lodge",
    location: "Maasai Mara, Kenya",
    type: "Lodge",
    host: {
      name: "Daniel Mwangi",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg",
      superhost: true,
    },
    description: "Luxury safari lodge with amazing savannah views.",
    images: [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
      "https://images.unsplash.com/photo-1519821172141-b5d8d0f6c3f5",
    ],
    adventures: [
      { title: "Sunset Game Drive", price: 50, available: true },
      { title: "Hot Air Balloon Safari", price: 120, available: false },
    ],
    availability: [
      { from: "Nairobi", to: "Maasai Mara", mode: "PSV", price: 60, departure: "08:00", arrival: "12:00" },
      { from: "Nairobi", to: "Maasai Mara", mode: "Flight", price: 180, departure: "09:00", arrival: "10:00" },
    ],
  },
  {
    id: 2,
    title: "Diani Beach Oceanfront Villa",
    location: "Diani Beach, Kenya",
    type: "Villa",
    host: {
      name: "Amina Hassan",
      avatar: "https://randomuser.me/api/portraits/women/44.jpg",
      superhost: true,
    },
    description: "Stunning beachfront villa for relaxation and water adventures.",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
    ],
    adventures: [
      { title: "Snorkeling", price: 40, available: true },
      { title: "Jet Skiing", price: 50, available: true },
    ],
    availability: [
      { from: "Nairobi", to: "Diani Beach", mode: "Flight", price: 100, departure: "10:00", arrival: "11:00" },
      { from: "Voi", to: "Diani Beach", mode: "Voi", price: 25, departure: "12:00", arrival: "13:00" },
    ],
  },
  {
    id: 3,
    title: "Nairobi Central Apartment",
    location: "Nairobi, Kenya",
    type: "Apartment",
    host: {
      name: "Brian Otieno",
      avatar: "https://randomuser.me/api/portraits/men/65.jpg",
      superhost: false,
    },
    description: "Modern city apartment ideal for business and urban exploration.",
    images: [
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb",
    ],
    adventures: [
      { title: "City Tour", price: 30, available: true },
      { title: "Food Experience", price: 25, available: true },
    ],
    availability: [
      { from: "Nairobi", to: "Naivasha", mode: "PSV", price: 50, departure: "07:00", arrival: "09:00" },
      { from: "Nairobi", to: "Nakuru", mode: "Train", price: 45, departure: "08:00", arrival: "11:00" },
    ],
  },
  {
    id: 4,
    title: "Naivasha Lakeside Lodge",
    location: "Naivasha, Kenya",
    type: "Lodge",
    host: {
      name: "Caroline Njeri",
      avatar: "https://randomuser.me/api/portraits/women/22.jpg",
      superhost: false,
    },
    description: "Relax by the lake with boat rides and local wildlife.",
    images: [
      "https://images.unsplash.com/photo-1501117716987-c8e1ecb210c1",
    ],
    adventures: [
      { title: "Boat Safari", price: 35, available: true },
      { title: "Bird Watching", price: 20, available: true },
    ],
    availability: [
      { from: "Nairobi", to: "Naivasha", mode: "PSV", price: 55, departure: "07:30", arrival: "09:30" },
      { from: "Nakuru", to: "Naivasha", mode: "PSV", price: 40, departure: "09:00", arrival: "10:30" },
    ],
  },
  {
    id: 5,
    title: "Nakuru Mountain View Hotel",
    location: "Nakuru, Kenya",
    type: "Hotel",
    host: {
      name: "Peter Karanja",
      avatar: "https://randomuser.me/api/portraits/men/12.jpg",
      superhost: true,
    },
    description: "Enjoy mountain views and hiking adventures nearby.",
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    ],
    adventures: [
      { title: "Hiking Tour", price: 30, available: true },
      { title: "Lake Nakuru Safari", price: 40, available: true },
    ],
    availability: [
      { from: "Nairobi", to: "Nakuru", mode: "PSV", price: 50, departure: "08:00", arrival: "11:00" },
      { from: "Naivasha", to: "Nakuru", mode: "PSV", price: 45, departure: "09:30", arrival: "11:30" },
    ],
  },
  {
    id: 6,
    title: "Mombasa Beach Resort",
    location: "Mombasa, Kenya",
    type: "Resort",
    host: {
      name: "Fatuma Ali",
      avatar: "https://randomuser.me/api/portraits/women/33.jpg",
      superhost: true,
    },
    description: "Beach resort with all-inclusive activities.",
    images: [
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
    ],
    adventures: [
      { title: "Scuba Diving", price: 60, available: true },
      { title: "Beach Volleyball", price: 20, available: true },
    ],
    availability: [
      { from: "Nairobi", to: "Mombasa", mode: "Flight", price: 120, departure: "09:00", arrival: "11:00" },
      { from: "Voi", to: "Mombasa", mode: "Voi", price: 30, departure: "12:00", arrival: "15:00" },
    ],
  },
  {
    id: 7,
    title: "Voi Safari Lodge",
    location: "Voi, Kenya",
    type: "Lodge",
    host: {
      name: "Samuel Otieno",
      avatar: "https://randomuser.me/api/portraits/men/54.jpg",
      superhost: false,
    },
    description: "Perfect stopover for travelers heading to Diani or Tsavo.",
    images: [
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
    ],
    adventures: [
      { title: "Elephant Tracking", price: 50, available: true },
    ],
    availability: [
      { from: "Nairobi", to: "Voi", mode: "PSV", price: 70, departure: "08:00", arrival: "12:00" },
      { from: "Voi", to: "Diani Beach", mode: "Voi", price: 25, departure: "13:00", arrival: "14:00" },
    ],
  },
  {
    id: 8,
    title: "Tsavo East Safari Camp",
    location: "Tsavo East, Kenya",
    type: "Camp",
    host: {
      name: "Alice Mwende",
      avatar: "https://randomuser.me/api/portraits/women/12.jpg",
      superhost: false,
    },
    description: "Experience wildlife and guided tours in Tsavo.",
    images: [
      "https://images.unsplash.com/photo-1519821172141-b5d8d0f6c3f5",
    ],
    adventures: [
      { title: "Safari Drive", price: 45, available: true },
    ],
    availability: [
      { from: "Voi", to: "Tsavo East", mode: "PSV", price: 35, departure: "10:00", arrival: "12:00" },
      { from: "Tsavo East", to: "Diani Beach", mode: "Voi", price: 30, departure: "13:00", arrival: "15:00" },
    ],
  },
  {
    id: 9,
    title: "Malindi Beach Resort",
    location: "Malindi, Kenya",
    type: "Resort",
    host: {
      name: "Mohammed Hassan",
      avatar: "https://randomuser.me/api/portraits/men/22.jpg",
      superhost: true,
    },
    description: "Coastal resort with water sports and relaxation.",
    images: [
      "https://images.unsplash.com/photo-1499793983690-e29da59ef1c2",
    ],
    adventures: [
      { title: "Snorkeling", price: 40, available: true },
    ],
    availability: [
      { from: "Mombasa", to: "Malindi", mode: "PSV", price: 50, departure: "08:00", arrival: "11:00" },
      { from: "Voi", to: "Malindi", mode: "Voi", price: 60, departure: "09:00", arrival: "12:00" },
    ],
  },
  {
    id: 10,
    title: "Nairobi Boutique Hotel",
    location: "Nairobi, Kenya",
    type: "Hotel",
    host: {
      name: "Joyce Wanjiku",
      avatar: "https://randomuser.me/api/portraits/women/54.jpg",
      superhost: true,
    },
    description: "Stylish boutique hotel in the heart of Nairobi.",
    images: [
      "https://images.unsplash.com/photo-1484154218962-a197022b5858",
    ],
    adventures: [
      { title: "Art Tour", price: 20, available: true },
      { title: "City Museum Visit", price: 15, available: true },
    ],
    availability: [
      { from: "Nairobi", to: "Kisumu", mode: "Flight", price: 80, departure: "09:00", arrival: "10:30" },
      { from: "Nairobi", to: "Naivasha", mode: "PSV", price: 50, departure: "07:30", arrival: "09:00" },
    ],
  },
];

export default listings;