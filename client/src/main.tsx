import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Suppress Vite HMR WebSocket errors
window.addEventListener("unhandledrejection", (evt) => {
  if (evt.reason?.message?.includes?.("Failed to construct 'WebSocket'")) {
    evt.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
