const PUBLIC_PATHS = new Set(["/login"]);

const ROLE_PREFIX = {
  hr: ["/dashboard", "/hr"],
  evaluatee: ["/evaluatee"],
  evaluator: ["/evaluator"],
};

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore();
  authStore.restore();

  // ยังไม่เข้าสู่ระบบ -> ไป login เสมอ ยกเว้นหน้า public
  if (!authStore.isAuthenticated) {
    if (!PUBLIC_PATHS.has(to.path)) return navigateTo("/login");
    return;
  }

  // เข้าสู่ระบบแล้วแต่ยังเปิดหน้า login หรือหน้าแรก -> เด้งไปหน้าหลักตามบทบาท
  if (PUBLIC_PATHS.has(to.path) || to.path === "/") return navigateTo(authStore.roleHome);

  // บังคับเปลี่ยนรหัสผ่านเมื่อเข้าใช้งานครั้งแรก (5.2.1)
  if (authStore.user?.isFirstLogin && to.path !== "/change-password") {
    return navigateTo("/change-password");
  }

  // ตรวจสอบสิทธิ์การเข้าถึงหน้าตามบทบาท (RBAC ฝั่ง UI)
  const role = authStore.user?.role;
  const allowedPrefixes = ROLE_PREFIX[role] || [];
  const isRoleScoped = Object.values(ROLE_PREFIX).flat().some((p) => to.path.startsWith(p));
  if (isRoleScoped && !allowedPrefixes.some((p) => to.path.startsWith(p))) {
    return navigateTo(authStore.roleHome);
  }
});
