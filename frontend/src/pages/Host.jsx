import { useEffect, useState, useContext } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { AppContext } from "../context/AppContext";
import { hostService, userService } from "../services/api";

export default function Host() {
  const { user, setUser } = useContext(AppContext);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    title: "",
    description: "",
    type: "accommodation",
    pricing_type: "per_night",
    price_base: "",
    location: "",
    amenities: "",
    images: "",
    host_avatar: "",
    superhost: false,
    // Accommodation specific
    rooms: "",
    check_in_time: "",
    check_out_time: "",
    // Transport specific
    vehicle_type: "",
    capacity: "",
    pickup_location: "",
    dropoff_location: "",
  });
  const [editingService, setEditingService] = useState(null);

  const loadServices = async () => {
    if (!user || user.role !== "host") return;
    try {
      setLoading(true);
      const data = await hostService.getMyServices();
      setServices(data);
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to load your services. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [user]);

  const handleFormChange = (field, value) => {
    setServiceForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setEditingService(null);
    setServiceForm({
      title: "",
      description: "",
      type: "accommodation",
      pricing_type: "per_night",
      price_base: "",
      location: "",
      amenities: "",
      images: "",
      host_avatar: "",
      superhost: false,
      rooms: "",
      check_in_time: "",
      check_out_time: "",
      vehicle_type: "",
      capacity: "",
      pickup_location: "",
      dropoff_location: "",
    });
  };

  const handleApply = async () => {
    try {
      setLoading(true);
      const res = await userService.becomeHost();
      toast.success(res.message || "Your host application has been submitted. We'll review it shortly.");
      setUser({ ...user, host_application_status: res.host_application_status });
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to submit host application. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!serviceForm.title || !serviceForm.description || !serviceForm.price_base || !serviceForm.location) {
      toast.error("Please fill in all required fields (marked with *).");
      return;
    }

    if (serviceForm.type === "accommodation" && !serviceForm.rooms) {
      toast.error("Please specify the number of rooms for your accommodation listing.");
      return;
    }

    if (serviceForm.type === "transport" && (!serviceForm.vehicle_type || !serviceForm.capacity)) {
      toast.error("Please specify the vehicle type and passenger capacity for your transport service.");
      return;
    }

    const payload = {
      title: serviceForm.title,
      description: serviceForm.description,
      type: serviceForm.type,
      pricing_type: serviceForm.pricing_type,
      price_base: Number(serviceForm.price_base),
      location: serviceForm.location,
      amenities: serviceForm.amenities.split(",").map((item) => item.trim()).filter(Boolean),
      images: serviceForm.images.split(",").map((url) => url.trim()).filter(Boolean),
      host_avatar: serviceForm.host_avatar || undefined,
      superhost: serviceForm.superhost,
      // Add type-specific fields to payload if needed
      ...(serviceForm.type === "accommodation" && {
        rooms: Number(serviceForm.rooms),
        check_in_time: serviceForm.check_in_time,
        check_out_time: serviceForm.check_out_time,
      }),
      ...(serviceForm.type === "transport" && {
        vehicle_type: serviceForm.vehicle_type,
        capacity: Number(serviceForm.capacity),
        pickup_location: serviceForm.pickup_location,
        dropoff_location: serviceForm.dropoff_location,
      }),
    };

    try {
      setLoading(true);

      if (editingService) {
        await hostService.updateService(editingService.id, payload);
        toast.success("Your service listing has been updated successfully.");
      } else {
        await hostService.createService(payload);
        toast.success("Your service has been submitted and is pending admin approval.");
      }

      resetForm();
      loadServices();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message || "Failed to submit service. Please check your details and try again.");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (service) => {
    setEditingService(service);
    setServiceForm({
      title: service.title || "",
      description: service.description || "",
      type: service.type || "accommodation",
      pricing_type: service.pricing_type || "per_night",
      price_base: service.price || "",
      location: service.location || "",
      amenities: (service.amenities || []).join(", "),
      images: (service.images || []).join(", "),
      host_avatar: service.host?.avatar || "",
      superhost: service.host?.superhost || false,
      rooms: service.rooms || "",
      check_in_time: service.check_in_time || "",
      check_out_time: service.check_out_time || "",
      vehicle_type: service.vehicle_type || "",
      capacity: service.capacity || "",
      pickup_location: service.pickup_location || "",
      dropoff_location: service.dropoff_location || "",
    });
  };

  const hostInfo = (
    <div className="rounded-3xl border border-[#E8D9B8] bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-[#3D2B1A]">Become a Host on AfriStay</h1>
      <p className="mt-4 text-gray-600 text-lg">
        Share your unique stays, trips, or local transport services with travellers across Africa.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-[#F2E2C7] bg-[#FFFBF2] p-5">
          <h2 className="font-semibold text-[#3D2B1A]">Why host with us?</h2>
          <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-2">
            <li>Reach travellers across Africa and beyond.</li>
            <li>Get visibility for unique stays and experiences.</li>
            <li>Easy service submission and updates.</li>
            <li>Admin approval workflow keeps trust high.</li>
          </ul>
        </div>
        <div className="rounded-3xl border border-[#F2E2C7] bg-[#FFFBF2] p-5">
          <h2 className="font-semibold text-[#3D2B1A]">What we offer</h2>
          <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-2">
            <li>Host dashboard to manage your services.</li>
            <li>Booking and guest communication tools.</li>
            <li>Service visibility after approval.</li>
            <li>Flexible pricing and availability control.</li>
          </ul>
        </div>
      </div>
    </div>
  );

  const guestPrompt = (
    <div className="rounded-3xl border border-[#E8D9B8] bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-semibold text-[#3D2B1A]">Start hosting on AfriStay</h1>
      <p className="mt-4 text-gray-600">
        Create an account to apply as a host and list your services for approval.
      </p>
      <div className="mt-6 flex flex-col gap-4 sm:flex-row">
        <Link
          to="/login"
          className="rounded-full bg-[#C4622D] px-6 py-3 text-white text-center"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="rounded-full border border-[#C4622D] px-6 py-3 text-[#C4622D] text-center"
        >
          Register
        </Link>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {hostInfo}
        {guestPrompt}
      </div>
    );
  }

  const isHost = user.role === "host";

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {hostInfo}

      {!isHost && (
        <div className="rounded-3xl border border-[#E8D9B8] bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4">
            <h2 className="text-3xl font-semibold text-[#3D2B1A]">Become a host</h2>
            <p className="text-gray-600">
              Let travellers book your accommodation or transport service. Submit your host application and wait for admin approval.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-[#F2E2C7] bg-[#FFFBF2] p-5">
                <h3 className="font-semibold text-[#3D2B1A]">Host benefits</h3>
                <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-2">
                  <li>Flexible listing controls.</li>
                  <li>Booking visibility once approved.</li>
                  <li>Earn more from local travellers.</li>
                  <li>Host verification by admin.</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-[#F2E2C7] bg-[#FFFBF2] p-5">
                <h3 className="font-semibold text-[#3D2B1A]">How it works</h3>
                <ul className="mt-3 list-disc list-inside text-sm text-gray-700 space-y-2">
                  <li>Apply to become a host.</li>
                  <li>Submit your service details.</li>
                  <li>Wait for admin approval.</li>
                  <li>Start receiving bookings.</li>
                </ul>
              </div>
            </div>

            {user.host_application_status === "pending" ? (
              <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-4 text-yellow-900">
                Your host application is pending approval.
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={loading}
                className="rounded-full bg-[#C4622D] px-6 py-3 text-white hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Submitting..." : "Apply to Become a Host"}
              </button>
            )}
          </div>
        </div>
      )}

      {isHost && (
        <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
          <div className="space-y-6 rounded-3xl border border-[#E8D9B8] bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-semibold text-[#3D2B1A]">List a Service</h2>
              <p className="text-gray-600">Create a service listing for review by the admin.</p>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service Title <span className="text-red-500">*</span></label>
                <input
                  value={serviceForm.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                  className="w-full rounded-2xl border p-3"
                  placeholder="e.g., Cozy Beach Villa"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description <span className="text-red-500">*</span></label>
                <textarea
                  value={serviceForm.description}
                  onChange={(e) => handleFormChange("description", e.target.value)}
                  className="w-full min-h-[140px] rounded-2xl border p-3"
                  placeholder="Describe your service in detail, including what makes it special"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium mb-1">Service Type <span className="text-red-500">*</span></label>
                  <select
                    value={serviceForm.type}
                    onChange={(e) => handleFormChange("type", e.target.value)}
                    className="w-full rounded-2xl border p-3"
                  >
                    <option value="accommodation">Accommodation</option>
                    <option value="transport">Transport</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pricing Type <span className="text-red-500">*</span></label>
                  <select
                    value={serviceForm.pricing_type}
                    onChange={(e) => handleFormChange("pricing_type", e.target.value)}
                    className="w-full rounded-2xl border p-3"
                  >
                    <option value="per_night">Per Night</option>
                    <option value="per_hour">Per Hour</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="per_km">Per KM</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base Price <span className="text-red-500">*</span></label>
                <input
                  value={serviceForm.price_base}
                  onChange={(e) => handleFormChange("price_base", e.target.value)}
                  className="w-full rounded-2xl border p-3"
                  placeholder="e.g., 5000"
                  type="number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location <span className="text-red-500">*</span></label>
                <input
                  value={serviceForm.location}
                  onChange={(e) => handleFormChange("location", e.target.value)}
                  className="w-full rounded-2xl border p-3"
                  placeholder="Full address or location name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Amenities</label>
                <input
                  value={serviceForm.amenities}
                  onChange={(e) => handleFormChange("amenities", e.target.value)}
                  className="w-full rounded-2xl border p-3"
                  placeholder="e.g., WiFi, Pool, Breakfast (comma separated)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URLs</label>
                <input
                  value={serviceForm.images}
                  onChange={(e) => handleFormChange("images", e.target.value)}
                  className="w-full rounded-2xl border p-3"
                  placeholder="Comma separated image URLs"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Host Avatar URL</label>
                <input
                  value={serviceForm.host_avatar}
                  onChange={(e) => handleFormChange("host_avatar", e.target.value)}
                  className="w-full rounded-2xl border p-3"
                  placeholder="URL to your profile picture"
                />
              </div>

              {serviceForm.type === "accommodation" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Rooms <span className="text-red-500">*</span></label>
                    <input
                      value={serviceForm.rooms}
                      onChange={(e) => handleFormChange("rooms", e.target.value)}
                      className="w-full rounded-2xl border p-3"
                      placeholder="e.g., 2"
                      type="number"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Check-in Time</label>
                      <input
                        value={serviceForm.check_in_time}
                        onChange={(e) => handleFormChange("check_in_time", e.target.value)}
                        className="w-full rounded-2xl border p-3"
                        placeholder="e.g., 14:00"
                        type="time"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Check-out Time</label>
                      <input
                        value={serviceForm.check_out_time}
                        onChange={(e) => handleFormChange("check_out_time", e.target.value)}
                        className="w-full rounded-2xl border p-3"
                        placeholder="e.g., 11:00"
                        type="time"
                      />
                    </div>
                  </div>
                </>
              )}

              {serviceForm.type === "transport" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Vehicle Type <span className="text-red-500">*</span></label>
                    <input
                      value={serviceForm.vehicle_type}
                      onChange={(e) => handleFormChange("vehicle_type", e.target.value)}
                      className="w-full rounded-2xl border p-3"
                      placeholder="e.g., Sedan, SUV, Minibus"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Capacity <span className="text-red-500">*</span></label>
                    <input
                      value={serviceForm.capacity}
                      onChange={(e) => handleFormChange("capacity", e.target.value)}
                      className="w-full rounded-2xl border p-3"
                      placeholder="Number of passengers"
                      type="number"
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium mb-1">Pickup Location</label>
                      <input
                        value={serviceForm.pickup_location}
                        onChange={(e) => handleFormChange("pickup_location", e.target.value)}
                        className="w-full rounded-2xl border p-3"
                        placeholder="Pickup address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Dropoff Location</label>
                      <input
                        value={serviceForm.dropoff_location}
                        onChange={(e) => handleFormChange("dropoff_location", e.target.value)}
                        className="w-full rounded-2xl border p-3"
                        placeholder="Dropoff address"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex items-center gap-3">
                <input
                  id="superhost"
                  type="checkbox"
                  checked={serviceForm.superhost}
                  onChange={(e) => handleFormChange("superhost", e.target.checked)}
                  className="h-4 w-4"
                />
                <label htmlFor="superhost" className="text-sm text-gray-700">
                  Mark as superhost listing
                </label>
              </div>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full rounded-2xl bg-[#C4622D] py-3 text-white hover:opacity-90 disabled:opacity-60"
              >
                {editingService ? "Update Service" : "Submit Service"}
              </button>
            </div>
          </div>

          <aside className="rounded-3xl border border-[#E8D9B8] bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold text-[#3D2B1A]">Your Listings</h2>
            <p className="mt-2 text-gray-600">All services you have submitted, including those pending approval.</p>

            <div className="mt-6 space-y-4">
              {loading && <p className="text-sm text-gray-500">Loading services...</p>}
              {!loading && services.length === 0 && (
                <p className="text-sm text-gray-500">No services yet. Submit your first listing.</p>
              )}
              {services.map((service) => (
                <div key={service.id} className="rounded-3xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{service.title}</h3>
                      <p className="text-sm text-gray-500">{service.location}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                      {service.approval_status}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-gray-600">{service.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-700">
                    <span>{service.pricing_type}</span>
                    <span>₦{service.price}</span>
                  </div>
                  <button
                    onClick={() => startEdit(service)}
                    className="mt-4 rounded-2xl border border-[#C4622D] px-4 py-2 text-sm text-[#C4622D] hover:bg-[#F2E1D4]"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
