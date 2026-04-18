import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import client from "../../api/client.js";

const stored = () => {
  try {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    const user = userRaw ? JSON.parse(userRaw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

export const registerUser = createAsyncThunk(
  "auth/register",
  async ({ name, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await client.post("/auth/register", { name, email, password });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Registration failed");
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await client.post("/auth/login", { email, password });
      return data;
    } catch (e) {
      return rejectWithValue(e.response?.data?.message || "Login failed");
    }
  }
);

export const fetchMe = createAsyncThunk("auth/me", async (_, { rejectWithValue }) => {
  try {
    const { data } = await client.get("/auth/me");
    return data;
  } catch (e) {
    return rejectWithValue(e.response?.data?.message || "Session invalid");
  }
});

const initial = stored();

const authSlice = createSlice({
  name: "auth",
  initialState: {
    token: initial.token,
    user: initial.user,
    status: "idle",
    error: null,
  },
  reducers: {
    logout(state) {
      state.token = null;
      state.user = null;
      state.error = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(registerUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Error";
      })
      .addCase(loginUser.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.token = action.payload.token;
        state.user = action.payload.user;
        localStorage.setItem("token", action.payload.token);
        localStorage.setItem("user", JSON.stringify(action.payload.user));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Error";
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.user = action.payload;
        localStorage.setItem("user", JSON.stringify(action.payload));
      })
      .addCase(fetchMe.rejected, (state) => {
        state.token = null;
        state.user = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
