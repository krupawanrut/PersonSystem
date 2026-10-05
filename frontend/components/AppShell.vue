<script setup>
const props = defineProps({
  navItems: { type: Array, required: true }, // [{ label, to, icon }]
});

const route = useRoute();
const authStore = useAuthStore();

function initials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

async function handleLogout() {
  try {
    const api = useApi();
    await api.post("/auth/logout");
  } catch {
    // ไม่ต้องบล็อกการออกจากระบบแม้เรียก API ไม่สำเร็จ
  }
  authStore.logout();
  navigateTo("/login");
}
</script>

<template>
  <div class="min-h-screen flex flex-wrap bg-brand-bg">
    <!-- ===== sidebar ===== -->
    <div
      class="flex-1 basis-[220px] min-w-[210px] text-white px-4 py-6 flex flex-col gap-7"
      style="background: linear-gradient(185deg, #13203b 0%, #1f4e8c 140%)"
    >
      <div class="flex items-center gap-2.5 px-1.5">
        <div class="flex-none w-9 h-9 rounded-[10px] bg-white/15 flex items-center justify-center">
          <Icon name="shield" :size="20" />
        </div>
        <div class="text-sm font-bold leading-tight">ระบบประเมิน<br />บุคลากร</div>
      </div>

      <nav class="flex flex-col gap-1">
        <NuxtLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
          :class="{ 'bg-white/15 text-white font-semibold': route.path.startsWith(item.to) }"
        >
          <Icon :name="item.icon" :size="17" />
          {{ item.label }}
        </NuxtLink>
      </nav>

      <div class="mt-auto flex flex-col gap-3">
        <div class="h-px bg-white/10"></div>
        <NuxtLink to="/account" class="flex items-center gap-2.5 px-1 py-1 rounded-lg hover:bg-white/10">
          <div class="flex-none w-[34px] h-[34px] rounded-full bg-white/15 flex items-center justify-center text-xs font-bold">
            {{ initials(authStore.user?.fullName) }}
          </div>
          <div class="min-w-0">
            <div class="text-sm font-semibold truncate">{{ authStore.user?.fullName }}</div>
            <div class="text-[11px] text-white/60">
              {{ { hr: "ฝ่ายบุคลากร", evaluatee: "ผู้รับการประเมิน", evaluator: "กรรมการผู้ประเมิน" }[authStore.user?.role] }}
            </div>
          </div>
        </NuxtLink>
        <button class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white text-left" @click="handleLogout">
          <Icon name="logout" :size="16" />
          ออกจากระบบ
        </button>
      </div>
    </div>

    <!-- ===== main content ===== -->
    <div class="flex-[999] basis-[560px] min-w-0 px-6 py-7 pb-12 md:px-8">
      <slot />
    </div>
  </div>
</template>
