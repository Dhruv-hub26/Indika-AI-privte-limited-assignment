import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import client from "../../api/client.js";

export const loadUsers = createAsyncThunk("admin/users", async (_, { rejectWithValue }) => {
  try {
    const { data } = await client.get("/admin/users");
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Failed to load users");
  }
});

const adminSlice = createSlice({
  name: "admin",
  initialState: {
    users: [],
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(loadUsers.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loadUsers.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.users = action.payload;
      })
      .addCase(loadUsers.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Error";
      });
  },
});

export default adminSlice.reducer;
