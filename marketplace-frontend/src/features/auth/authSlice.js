import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';
import toast from 'react-hot-toast';

const stored = localStorage.getItem('user');

export const register = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const login = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data);
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const getMe = createAsyncThunk('auth/getMe', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/auth/me', data);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: stored ? JSON.parse(stored) : null,
    token: localStorage.getItem('token') || null,
    loading: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user  = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    clearError(state) { state.error = null; },
  },
  extraReducers: (builder) => {
    const pending  = (state) => { state.loading = true; state.error = null; };
    const rejected = (state, action) => { state.loading = false; state.error = action.payload; };

    builder
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, (state, { payload }) => {
        state.loading = false; state.user = payload.user; state.token = payload.token;
        toast.success('Compte créé avec succès !');
      })
      .addCase(register.rejected, (state, action) => { rejected(state, action); toast.error(action.payload); })

      .addCase(login.pending, pending)
      .addCase(login.fulfilled, (state, { payload }) => {
        state.loading = false; state.user = payload.user; state.token = payload.token;
        toast.success(`Bienvenue, ${payload.user.name.split(' ')[0]} !`);
      })
      .addCase(login.rejected, (state, action) => { rejected(state, action); toast.error(action.payload); })

      .addCase(getMe.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        localStorage.setItem('user', JSON.stringify(payload.user));
      })

      .addCase(updateProfile.pending, pending)
      .addCase(updateProfile.fulfilled, (state, { payload }) => {
        state.loading = false; state.user = payload.user;
        toast.success('Profil mis à jour !');
      })
      .addCase(updateProfile.rejected, (state, action) => { rejected(state, action); toast.error(action.payload); });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
