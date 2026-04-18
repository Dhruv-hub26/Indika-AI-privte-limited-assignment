import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  loadTasks,
  createTask,
  updateTask,
  removeTask,
  uploadPdfs,
  deleteAttachment,
} from "../store/slices/taskSlice.js";
import client from "../api/client.js";

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

function badge(status) {
  const map = {
    todo: "bg-slate-500/20 text-slate-200 ring-slate-500/30",
    in_progress: "bg-amber-500/15 text-amber-200 ring-amber-500/30",
    done: "bg-emerald-500/15 text-emerald-200 ring-emerald-500/30",
  };
  return map[status] || map.todo;
}

function priorityBadge(p) {
  const map = {
    low: "text-slate-300",
    medium: "text-amber-200",
    high: "text-rose-200",
  };
  return map[p] || map.medium;
}

function emptyForm() {
  return {
    title: "",
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: "",
  };
}

export default function Dashboard() {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { items, status, error } = useSelector((s) => s.tasks);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [newFiles, setNewFiles] = useState([]);
  const [formError, setFormError] = useState("");
  const [uploadError, setUploadError] = useState("");

  const filters = useMemo(
    () => ({ status: filterStatus || undefined, priority: filterPriority || undefined }),
    [filterStatus, filterPriority]
  );

  useEffect(() => {
    dispatch(loadTasks(filters));
  }, [dispatch, filters]);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setNewFiles([]);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(task) {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description || "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function saveTask(e) {
    e.preventDefault();
    setFormError("");
    const payload = {
      title: form.title,
      description: form.description,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || null,
    };
    if (editing) {
      const res = await dispatch(updateTask({ id: editing._id, ...payload }));
      if (res.meta.requestStatus === "rejected") {
        setFormError(res.payload || "Could not update");
        return;
      }
    } else {
      if (newFiles.length > 3) {
        setFormError("Select at most 3 PDF files.");
        return;
      }
      const fd = new FormData();
      fd.append("title", payload.title);
      fd.append("description", payload.description || "");
      fd.append("status", payload.status);
      fd.append("priority", payload.priority);
      if (payload.dueDate) fd.append("dueDate", payload.dueDate);
      for (const f of newFiles) {
        fd.append("pdfs", f);
      }
      const res = await dispatch(createTask(fd));
      if (res.meta.requestStatus === "rejected") {
        setFormError(res.payload || "Could not create");
        return;
      }
    }
    setModalOpen(false);
    dispatch(loadTasks(filters));
  }

  async function onDelete(id) {
    if (!confirm("Delete this task?")) return;
    await dispatch(removeTask(id));
    dispatch(loadTasks(filters));
  }

  async function onPickFiles(task, e) {
    setUploadError("");
    const files = Array.from(e.target.files || []).filter((f) => f.type === "application/pdf");
    e.target.value = "";
    if (!files.length) return;
    const current = task.attachments?.length || 0;
    if (current + files.length > 3) {
      setUploadError("Each task allows at most 3 PDF attachments.");
      return;
    }
    const res = await dispatch(uploadPdfs({ taskId: task._id, files }));
    if (res.meta.requestStatus === "rejected") {
      setUploadError(res.payload || "Upload failed");
    } else {
      dispatch(loadTasks(filters));
    }
  }

  async function onRemoveFile(taskId, filename) {
    await dispatch(deleteAttachment({ taskId, filename }));
    dispatch(loadTasks(filters));
  }

  async function downloadFile(taskId, filename, originalName) {
    const res = await client.get(`/tasks/${taskId}/attachments/${filename}`, { responseType: "blob" });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = originalName || filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            {user?.role === "admin"
              ? "You are viewing every task in the workspace."
              : "Your tasks, filtered the way you like."}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:bg-accent-dim"
        >
          New task
        </button>
      </div>

      <div className="flex flex-wrap gap-3 rounded-xl border border-white/10 bg-ink-900/40 p-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">Status</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-accent/30 focus:ring-2"
          >
            {statuses.map((s) => (
              <option key={s.value || "all"} value={s.value}>
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
              <option key={p.value || "allp"} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {uploadError && <p className="text-sm text-rose-400">{uploadError}</p>}
      {error && <p className="text-sm text-rose-400">{error}</p>}

      {status === "loading" ? (
        <p className="text-sm text-slate-400">Loading tasks…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((task) => {
            const ownerLabel =
              typeof task.owner === "object" && task.owner
                ? `${task.owner.name} (${task.owner.email})`
                : null;
            const ownerId =
              typeof task.owner === "object" && task.owner?._id != null
                ? String(task.owner._id)
                : task.owner != null
                  ? String(task.owner)
                  : "";
            const uid = user?.id != null ? String(user.id) : "";
            const canMutate = user?.role === "admin" || (!!ownerId && ownerId === uid);
            const attCount = task.attachments?.length || 0;
            const slotsLeft = Math.max(0, 3 - attCount);

            return (
              <article
                key={task._id}
                className="flex flex-col rounded-xl border border-white/10 bg-ink-900/50 p-5 shadow-lg shadow-black/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-white">{task.title}</h2>
                    {ownerLabel && user?.role === "admin" && (
                      <p className="mt-1 text-xs text-slate-500">Owner: {ownerLabel}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${badge(task.status)}`}
                  >
                    {task.status.replace("_", " ")}
                  </span>
                </div>
                {task.description && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{task.description}</p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                  <span className={priorityBadge(task.priority)}>Priority: {task.priority}</span>
                  {task.dueDate && (
                    <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                  )}
                </div>

                <div className="mt-4 border-t border-white/5 pt-4">
                  <p className="text-xs font-medium text-slate-500">PDF attachments ({attCount}/3)</p>
                  <ul className="mt-2 space-y-1 text-sm text-slate-300">
                    {(task.attachments || []).map((a) => (
                      <li key={a.filename} className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => downloadFile(task._id, a.filename, a.originalName)}
                          className="truncate text-left text-indigo-300 hover:text-indigo-200"
                        >
                          {a.originalName}
                        </button>
                        {canMutate && (
                          <button
                            type="button"
                            onClick={() => onRemoveFile(task._id, a.filename)}
                            className="shrink-0 text-xs text-rose-300 hover:text-rose-200"
                          >
                            Remove
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {canMutate && slotsLeft > 0 && (
                    <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-indigo-300 hover:text-indigo-200">
                      <input
                        type="file"
                        accept="application/pdf"
                        multiple
                        className="hidden"
                        onChange={(e) => onPickFiles(task, e)}
                      />
                      <span>Add PDF (up to {slotsLeft} more)</span>
                    </label>
                  )}
                </div>

                {canMutate && (
                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() => openEdit(task)}
                      className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-white/20"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(task._id)}
                      className="rounded-lg border border-rose-500/30 px-3 py-1.5 text-xs font-medium text-rose-200 hover:border-rose-400/50"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </article>
            );
          })}
          {items.length === 0 && (
            <p className="text-sm text-slate-500 md:col-span-2">No tasks match these filters.</p>
          )}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-900 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-white">{editing ? "Edit task" : "New task"}</h3>
            <form onSubmit={saveTask} className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-400">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-accent/30 focus:ring-2"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-accent/30 focus:ring-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-accent/30 focus:ring-2"
                  >
                    <option value="todo">To do</option>
                    <option value="in_progress">In progress</option>
                    <option value="done">Done</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Priority</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-accent/30 focus:ring-2"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400">Due date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-white outline-none ring-accent/30 focus:ring-2"
                />
              </div>
              {!editing && (
                <div>
                  <label className="text-xs text-slate-400">PDF attachments (up to 3)</label>
                  <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []).filter(
                        (f) => f.type === "application/pdf"
                      );
                      e.target.value = "";
                      setNewFiles(files.slice(0, 3));
                    }}
                    className="mt-1 block w-full cursor-pointer rounded-lg border border-white/10 bg-ink-950 px-3 py-2 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-white/15"
                  />
                  {newFiles.length > 0 && (
                    <p className="mt-2 text-xs text-slate-400">
                      Selected: {newFiles.map((f) => f.name).join(", ")}
                    </p>
                  )}
                </div>
              )}
              {formError && <p className="text-sm text-rose-400">{formError}</p>}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:border-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-dim"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
