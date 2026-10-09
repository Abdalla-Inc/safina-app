import React from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/noto-sans-arabic/400.css";
import "@fontsource/noto-sans-arabic/500.css";
import "@fontsource/noto-sans-arabic/600.css";
import "@fontsource/noto-sans-arabic/700.css";
import "@fontsource/amiri/400.css";
import App from "./App.jsx";
import { AccountProvider } from "./connected/Session.jsx";
import "./styles.css";
createRoot(document.getElementById("root")).render(
  <AccountProvider>
    <App />
  </AccountProvider>,
);
