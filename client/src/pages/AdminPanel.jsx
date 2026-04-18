import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loadUsers } from "../store/slices/adminSlice.js";
import { loadAdminTasks } from "../store/slices/taskSlice.js";

const statuses = [
  { value: "", label: "All statuses" },
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const priorities = [
  { value: "", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export default function AdminPanel() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { users, status: userStatus, error: userError } = useSelector((s) => s.admin);
  const { items: tasks, status: taskStatus, error: taskError } = useSelector((s) => s.tasks);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [filterOwner, setFilterOwner] = useState("");

  const filters = useMemo(
    () => ({
      status: filterStatus || undefined,
      priority: filterPriority || undefined,
      owner: filterOwner || undefined,
    }),
    [filterStatus, filterPriority, filterOwner]
  );

  useEffect(() => {
    dispatch(loadUsers());
  }, [dispatch]);

  useEffect(() => {
    dispatch(loadAdminTasks(filters));
  }, [dispatch, filterStatus, filterPriority, filterOwner]);

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-white">Admin panel</h1>
        <p className="mt-1 text-sm text-slate-400">Users across the system and every task.</p>
      </div>

      <section className="rounded-xl border border-white/10 bg-ink-900/50 p-6">
        <h2 className="text-lg font-medium text-white">Users</h2>
        {userError && <p className="mt-2 text-sm text-rose-400">{userError}</p>}
        {userStatus === "loading" ? (
          <p className="mt-4 text-sm text-slate-400">Loading users…</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 font-medium">Name</th>
                  <th className="pb-2 font-medium">Email</th>
                  <th className="pb-2 font-medium">Role</th>
                  <th className="pb-2 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-200">
                {users.map((u) => (
                  <tr key={u._id}>
                    <td className="py-3 pr-4">{u.name}</td>
                    <td className="py-3 pr-4">{u.email}</td>
                    <td className="py-3 pr-4 capitalize">{u.role}</td>
                    <td className="py-3 text-slate-400">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && <p className="mt-4 text-sm text-slate-500">No users yet.</p>}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-white/10 bg-ink-900/50 p-6">
        <h2 className="text-lg font-medium text-white">All tasks</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Owner</span>
            <select
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              className="rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-accent/30 focus:ring-2"
            >
              <option value="">All users</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Status</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-accent/30 focus:ring-2"
            >
              {statuses.map((s) => (
                <option key={s.value || "st"} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-xs font-medium text-slate-500">Priority</span>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-accent/30 focus:ring-2"
            >
              {priorities.map((p) => (
                <option key={p.value || "pr"} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {taskError && <p className="mt-3 text-sm text-rose-400">{taskError}</p>}
        {taskStatus === "loading" ? (
          <p className="mt-4 text-sm text-slate-400">Loading tasks…</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {tasks.map((t) => {
              const owner =
                typeof t.owner === "object" && t.owner
                  ? `${t.owner.name} <${t.owner.email}>`
                  : "Unknown";
              return (
                <li
                  key={t._id}
                  className="rounded-lg border border-white/5 bg-ink-950/60 px-4 py-3 text-sm text-slate-200"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-white">{t.title}</span>
                    <span className="text-xs capitalize text-slate-400">
                      {t.status.replace("_", " ")} · {t.priority}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{owner}</p>
                </li>
              );
            })}
            {tasks.length === 0 && <p className="text-sm text-slate-500">No tasks match filters.</p>}
          </ul>
        )}
      </section>
    </div>
  );
}
