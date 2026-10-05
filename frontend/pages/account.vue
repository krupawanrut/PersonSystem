<script setup>
const NAV_BY_ROLE = {
  hr: [
    { label: "แดชบอร์ด", to: "/dashboard", icon: "grid" },
    { label: "หัวข้อการประเมิน", to: "/hr/topics", icon: "doc" },
    { label: "ผู้รับการประเมิน", to: "/hr/evaluatees", icon: "people" },
    { label: "กรรมการผู้ประเมิน", to: "/hr/evaluators", icon: "judge" },
    { label: "รายงาน", to: "/hr/reports", icon: "bars" },
  ],
  evaluatee: [
    { label: "การประเมินตนเอง", to: "/evaluatee/self-evaluation", icon: "doc" },
    { label: "รายงานของฉัน", to: "/evaluatee/report", icon: "award" },
  ],
  evaluator: [
    { label: "ประเมินผู้รับการประเมิน", to: "/evaluator/scoring", icon: "judge" },
  ],
};

const api = useApi();
const authStore = useAuthStore();
const navItems = computed(() => NAV_BY_ROLE[authStore.user?.role] || []);

const fullName = ref(authStore.user?.fullName || "");
const email = ref("");
const saved = ref(false);
const errorMessage = ref("");

async function load() {
  const { data } = await api.get("/auth/me");
  fullName.value = data.data.fullName;
  email.value = data.data.email || "";
}

async function save() {
  errorMessage.value = "";
  saved.value = false;
  try {
    const { data } = await api.put("/auth/profile", { fullName: fullName.value, email: email.value });
    authStore.user.fullName = data.data.fullName;
    authStore.persist();
    saved.value = true;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "บันทึกไม่สำเร็จ";
  }
}

onMounted(load);
</script>

<template>
  <AppShell :nav-items="navItems">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-ink mb-1">บัญชีของฉัน</h1>
      <p class="text-sm text-ink-soft">แก้ไขข้อมูลส่วนตัวเบื้องต้น</p>
    </div>

    <div class="bg-white border border-gray-200 rounded-2xl p-5 max-w-md">
      <div v-if="errorMessage" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">{{ errorMessage }}</div>
      <div v-if="saved" class="text-sm text-[#1f4e8c] bg-[#e7eff9] border border-[#cddcf0] rounded-lg px-3 py-2 mb-4">บันทึกข้อมูลสำเร็จ</div>

      <form class="flex flex-col gap-4" @submit.prevent="save">
        <div>
          <label class="text-sm font-semibold text-ink block mb-1.5">ชื่อ-นามสกุล</label>
          <input v-model="fullName" class="input input-bordered w-full" />
        </div>
        <div>
          <label class="text-sm font-semibold text-ink block mb-1.5">อีเมล</label>
          <input v-model="email" type="email" class="input input-bordered w-full" />
        </div>
        <div class="flex justify-between items-center pt-2">
          <NuxtLink to="/change-password" class="text-sm font-semibold text-[#1f4e8c]">เปลี่ยนรหัสผ่าน</NuxtLink>
          <button type="submit" class="btn text-white border-none" style="background:#1f4e8c">บันทึก</button>
        </div>
      </form>
    </div>
  </AppShell>
</template>
