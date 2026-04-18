import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import client from "../../api/client.js";

export const loadTasks = createAsyncThunk(
  "tasks/load",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      const q = params.toString();
      const { data } = await client.get(`/tasks${q ? `?${q}` : ""}`);
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Failed to load tasks");
    }
  }
);

export const loadAdminTasks = createAsyncThunk(
  "tasks/loadAdmin",
  async (filters = {}, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.priority) params.set("priority", filters.priority);
      if (filters.owner) params.set("owner", filters.owner);
      const q = params.toString();
      const { data } = await client.get(`/admin/tasks${q ? `?${q}` : ""}`);
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Failed to load tasks");
    }
  }
);

export const createTask = createAsyncThunk(
  "tasks/create",
  async (payload, { rejectWithValue }) => {
    try {
      const isForm = typeof FormData !== "undefined" && payload instanceof FormData;
      const { data } = await client.post("/tasks", payload, isForm
        ? { headers: { "Content-Type": "multipart/form-data" } }
        : undefined);
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Create failed");
    }
  }
);

export const updateTask = createAsyncThunk(
  "tasks/update",
  async ({ id, ...payload }, { rejectWithValue }) => {
    try {
      const { data } = await client.put(`/tasks/${id}`, payload);
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Update failed");
    }
  }
);

export const removeTask = createAsyncThunk("tasks/remove", async (id, { rejectWithValue }) => {
  try {
    await client.delete(`/tasks/${id}`);
    return id;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Delete failed");
  }
});

export const uploadPdfs = createAsyncThunk(
  "tasks/uploadPdfs",
  async ({ taskId, files }, { rejectWithValue }) => {
    try {
      const fd = new FormData();
      for (const f of files) {
        fd.append("pdfs", f);
      }
      const { data } = await client.post(`/tasks/${taskId}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Upload failed");
    }
  }
);

export const deleteAttachment = createAsyncThunk(
  "tasks/deleteAttachment",
  async ({ taskId, filename }, { rejectWithValue }) => {
    try {
      const { data } = await client.delete(`/tasks/${taskId}/attachments/${filename}`);
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Remove failed");
    }
  }
);

const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    items: [],
    status: "idle",
    error: null,
    lastUpdatedId: null,
  },
  reducers: {
    upsertTask(state, action) {
      const t = action.payload;
      const i = state.items.findIndex((x) => x._id === t._id);
      if (i >= 0) state.items[i] = t;
      else state.items.unshift(t);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(loadTasks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadTasks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(loadTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Error";
      })
      .addCase(loadAdminTasks.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadAdminTasks.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload;
      })
      .addCase(loadAdminTasks.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Error";
      })
      .addCase(createTask.fulfilled, (state, action) => {
        state.items.unshift(action.payload);
      })
      .addCase(updateTask.fulfilled, (state, action) => {
        const t = action.payload;
        const i = state.items.findIndex((x) => x._id === t._id);
        if (i >= 0) state.items[i] = t;
      })
      .addCase(removeTask.fulfilled, (state, action) => {
        state.items = state.items.filter((x) => x._id !== action.payload);
      })
      .addCase(uploadPdfs.fulfilled, (state, action) => {
        const t = action.payload;
        const i = state.items.findIndex((x) => x._id === t._id);
        if (i >= 0) state.items[i] = t;
      })
      .addCase(deleteAttachment.fulfilled, (state, action) => {
        const t = action.payload;
        const i = state.items.findIndex((x) => x._id === t._id);
        if (i >= 0) state.items[i] = t;
      });
  },
});

export const { upsertTask } = taskSlice.actions;
export default taskSlice.reducer;
