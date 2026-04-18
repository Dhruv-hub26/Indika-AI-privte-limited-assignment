import { NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../store/slices/authSlice.js";

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"
  }`;

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);

  return (
    <header className="border-b border-white/10 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent font-semibold text-white shadow-lg shadow-indigo-500/30">
            N
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Nexus Tasks</p>
            <p className="text-xs text-slate-500">Task management</p>
          </div>
        </div>
        <nav className="flex flex-wrap items-center gap-1">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>
          {user?.role === "admin" && (
            <NavLink to="/admin" className={linkClass}>
              Admin
            </NavLink>
          )}
          <button
            type="button"
            onClick={() => {
              dispatch(logout());
              navigate("/login");
            }}
            className="ml-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-white/20 hover:text-white"
          >
            Log out
          </button>
        </nav>
      </div>
    </header>
  );
}
