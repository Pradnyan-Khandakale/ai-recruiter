"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useAuthStore = create((set, get) => ({
  user: null,
  token: typeof window !== "undefined" ? localStorage.getItem("recruitment_token") || "" : "",
  loading: false,
  initialized: false,

  async authenticate(mode, values) {
    set({ loading: true });
    try {
      const data = mode === "signup" ? await api.signup(values) : await api.login(values);
      if (typeof window !== "undefined" && data?.token) {
        localStorage.setItem("recruitment_token", data.token);
        document.cookie = `recruitment_token=${encodeURIComponent(data.token)}; path=/; max-age=604800; SameSite=Lax`;
      }
      set({ user: data?.user || null, token: data?.token || "", loading: false, initialized: true });
      return data;
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("recruitment_token");
      document.cookie = "recruitment_token=; path=/; max-age=0; SameSite=Lax";
    }
    set({ user: null, token: "", loading: false, initialized: true });
  },

  async loadProfile() {
    const token = get().token || (typeof window !== "undefined" ? localStorage.getItem("recruitment_token") : "");
    if (!token) {
      set({ user: null, token: "", initialized: true });
      return null;
    }
    try {
      const res = await api.me();
      set({ user: res?.user || null, token, initialized: true });
      return res?.user || null;
    } catch {
      get().logout();
      return null;
    }
  }
}));
