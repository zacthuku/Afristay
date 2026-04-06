import { createContext, useState } from "react";

export const AppContext = createContext();

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);

  return (
    <AppContext.Provider value={{ user, setUser, listings, setListings }}>
      {children}
    </AppContext.Provider>
  );
}