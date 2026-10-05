import { defineStore } from "pinia";

const ROLE_HOME = {
  hr: "/dashboard",
  evaluatee: "/evaluatee/self-evaluation",
  evaluator: "/evaluator/scoring",
};

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: null,
    user: null, // { id, username, fullName, role, department, isFirstLogin }
    restored: false,
  }),

  getters: {
    isAuthenticated: (state) => !!state.token,
    roleHome: (state) => (state.user ? ROLE_HOME[state.user.role] : "/login"),
  },

  actions: {
    // เรียกครั้งเดียวตอนแอปเริ่มทำงาน (plugins/auth.client.js) เพื่ออ่าน session เดิมจาก localStorage
    restore() {
      if (this.restored || !import.meta.client) return;
      const raw = localStorage.getItem("ps_session");
      if (raw) {
        try {
          const { token, user } = JSON.parse(raw);
          this.token = token;
          this.user = user;
        } catch {
          localStorage.removeItem("ps_session");
        }
      }
      this.restored = true;
    },

    persist() {
      if (import.meta.client) {
        localStorage.setItem("ps_session", JSON.stringify({ token: this.token, user: this.user }));
      }
    },

    async login(username, password) {
      const api = useApi();
      const { data } = await api.post("/auth/login", { username, password });
      this.token = data.data.token;
      this.user = data.data.user;
      this.persist();
      return this.user;
    },

    async changePassword({ currentPassword, newPassword }) {
      const api = useApi();
      await api.put("/auth/password", { currentPassword, newPassword });
      if (this.user) {
        this.user.isFirstLogin = false;
        this.persist();
      }
    },

    logout() {
      this.token = null;
      this.user = null;
      if (import.meta.client) localStorage.removeItem("ps_session");
    },
  },
});
