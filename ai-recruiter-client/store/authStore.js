"use client";

import { create } from "zustand";
import { api } from "@/lib/api";

export const useAuthStore = create((set) => ({
  user: null,
  token: "",
  loading: false,
  async authenticate(mode, values) {
    // TODO: Call the signup or login endpoint, persist the token in localStorage and the
    // TODO: recruitment_token cookie, store the session, and return the response data.
  },
  logout() {
    // TODO: Clear the stored token and cookie and reset the session state.
  }
}));
