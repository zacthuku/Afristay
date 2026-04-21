import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Home from "./pages/Home";
import Search from "./pages/Search";
import ListingDetail from "./pages/ListingDetail";
import Layout from "./layouts/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Careers from "./pages/Careers";
import Press from "./pages/Press";
import HostResources from "./pages/HostResources";
import ResponsibleHosting from "./pages/ResponsibleHosting";
import Community from "./pages/Community";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCareers from "./pages/AdminCareers";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminUsers from "./pages/AdminUsers";
import AdminApprovals from "./pages/AdminApprovals";
import Host from "./pages/Host";
import Dashboard from "./pages/Dashboard";
import MyBookings from "./pages/MyBookings";
import Cart from "./pages/Cart";
import TripPlanner from "./pages/TripPlanner";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { useContext } from "react";
import { AppContext } from "./context/AppContext";

function AppRoutes() {
  const { user } = useContext(AppContext);

  return (
    <Routes>
      <Route element={<Layout />}>

        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/listing/:id" element={<ListingDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/host" element={user?.role === "admin" ? <Navigate to="/" replace /> : <Host />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/press" element={<Press />} />
        <Route path="/host-resources" element={<HostResources />} />
        <Route path="/responsible-hosting" element={<ResponsibleHosting />} />
        <Route path="/community" element={<Community />} />
        <Route path="/plan" element={<TripPlanner />} />

        {/* User protected routes */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute user={user}>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute user={user}>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute user={user}>
              <MyBookings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/cart"
          element={
            <ProtectedRoute user={user}>
              <Cart />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              <div className="p-10 text-[#3D2B1A]">User Dashboard</div>
            </ProtectedRoute>
          }
        />

        {/* Host protected routes */}
        <Route
          path="/host/dashboard"
          element={
            <ProtectedRoute user={user} role="host">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin protected routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute user={user} role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute user={user} role="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/approvals"
          element={
            <ProtectedRoute user={user} role="admin">
              <AdminApprovals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/careers"
          element={
            <ProtectedRoute user={user} role="admin">
              <AdminCareers />
            </ProtectedRoute>
          }
        />

      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      </BrowserRouter>
    </AppProvider>
  );
}
