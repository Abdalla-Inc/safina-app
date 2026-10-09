import { createContext, useContext } from "react";
export const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);
export const ar = (n) => new Intl.NumberFormat("ar-EG").format(n);
export function navigate(route) {
  location.hash = "/" + route;
  window.scrollTo({ top: 0, behavior: "instant" });
}
