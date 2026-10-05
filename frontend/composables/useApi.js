import axios from "axios";

// สร้าง axios instance ที่แนบ JWT Token ในทุกคำขอโดยอัตโนมัติ (docs ข้อ 4.5)
export function useApi() {
  const config = useRuntimeConfig();

  const api = axios.create({ baseURL: config.public.apiBase });

  api.interceptors.request.use((req) => {
    const authStore = useAuthStore();
    if (authStore.token) {
      req.headers.Authorization = `Bearer ${authStore.token}`;
    }
    return req;
  });

  api.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        const authStore = useAuthStore();
        authStore.logout();
        navigateTo("/login");
      }
      return Promise.reject(error);
    }
  );

  return api;
}
