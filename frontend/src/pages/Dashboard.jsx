import { Navbar } from "../components/Navbar";

export default function Dashboard() {
  return (
    <div>
      <Navbar />
      <div className="p-10">
        <h1 className="text-3xl font-bold mb-6">Host Dashboard</h1>
        <button className="bg-clay text-white px-4 py-2 rounded">
          Add New Listing
        </button>
      </div>
    </div>
  );
}