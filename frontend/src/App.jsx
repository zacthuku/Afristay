import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import Home from "./pages/Home";
import Search from "./pages/Search";
import {ListingDetail} from "./pages/ListingDetail";
import Layout from "./layouts/Layout";

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes >
          <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/listing/:id" element={<ListingDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}