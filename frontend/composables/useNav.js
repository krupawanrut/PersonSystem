// เมนูนำทางฝั่งซ้าย แยกตามบทบาท — ใช้ร่วมกันทุกหน้าเพื่อไม่ให้ต้องแก้หลายที่เวลาเพิ่ม/ลบเมนู
export const NAV_BY_ROLE = {
  hr: [
    { label: "แดชบอร์ด", to: "/dashboard", icon: "grid" },
    { label: "หัวข้อการประเมิน", to: "/hr/topics", icon: "doc" },
    { label: "ผู้รับการประเมิน", to: "/hr/evaluatees", icon: "people" },
    { label: "กรรมการผู้ประเมิน", to: "/hr/evaluators", icon: "judge" },
    { label: "รายงาน", to: "/hr/reports", icon: "bars" },
    { label: "สำรอง/กู้คืนข้อมูล", to: "/hr/backup", icon: "database" },
  ],
  evaluatee: [
    { label: "การประเมินตนเอง", to: "/evaluatee/self-evaluation", icon: "doc" },
    { label: "รายงานของฉัน", to: "/evaluatee/report", icon: "award" },
  ],
  evaluator: [{ label: "ประเมินผู้รับการประเมิน", to: "/evaluator/scoring", icon: "judge" }],
};

export function useNav() {
  const authStore = useAuthStore();
  const navItems = computed(() => NAV_BY_ROLE[authStore.user?.role] || []);
  return { navItems };
}
