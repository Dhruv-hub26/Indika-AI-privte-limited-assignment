import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "../store/slices/authSlice.js";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token, status, error } = useSelector((s) => s.auth);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (token) navigate("/dashboard", { replace: true });
  }, [token, navigate]);

  useEffect(() => () => dispatch(clearError()), [dispatch]);

  async function onSubmit(e) {
    e.preventDefault();
    const res = await dispatch(registerUser({ name, email, password }));
    if (res.meta.requestStatus === "fulfilled") {
      navigate("/dashboard", { replace: true });
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-ink-950 via-ink-900 to-indigo-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-ink-900/60 p-8 shadow-2xl shadow-indigo-900/40 backdrop-blur">
        <h1 className="text-2xl font-semibold text-white">Create account</h1>
        <p className="mt-1 text-sm text-slate-400">Start organizing work in one place.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-400">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white outline-none ring-accent/40 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white outline-none ring-accent/40 focus:ring-2"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-400">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950/80 px-3 py-2 text-sm text-white outline-none ring-accent/40 focus:ring-2"
            />
          </div>
          {error && <p className="text-sm text-rose-400">{error}</p>}
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-accent-dim disabled:opacity-60"
          >
            {status === "loading" ? "Creating…" : "Register"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-indigo-300 hover:text-indigo-200">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
