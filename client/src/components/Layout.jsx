import { Outlet } from "react-router-dom";
import Navbar from "./Navbar.jsx";

export default function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-950 via-ink-900 to-ink-950">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
