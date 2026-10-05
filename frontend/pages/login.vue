<script setup>
import { ref } from "vue";

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const remember = ref(false);
const errorMessage = ref("");
const loading = ref(false);

const authStore = useAuthStore();

async function handleSubmit() {
  errorMessage.value = "";
  if (!username.value || !password.value) {
    errorMessage.value = "กรุณากรอกชื่อผู้ใช้งานและรหัสผ่าน";
    return;
  }
  loading.value = true;
  try {
    const user = await authStore.login(username.value, password.value);
    if (remember.value) localStorage.setItem("ps_remember_username", username.value);
    if (user.isFirstLogin) {
      await navigateTo("/change-password");
    } else {
      await navigateTo(authStore.roleHome);
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  const saved = localStorage.getItem("ps_remember_username");
  if (saved) {
    username.value = saved;
    remember.value = true;
  }
});
</script>

<template>
  <div class="min-h-screen flex flex-wrap bg-brand-bg">
    <!-- ===== left: brand panel ===== -->
    <div
      class="flex-1 basis-[380px] min-w-[300px] relative overflow-hidden text-white px-12 py-14 flex flex-col justify-between"
      style="background: linear-gradient(160deg, #13203b 0%, #1f4e8c 120%)"
    >
      <div class="absolute -right-28 -bottom-28 w-80 h-80 rounded-full border border-white/10"></div>
      <div class="absolute -right-14 -bottom-14 w-52 h-52 rounded-full border border-white/15"></div>

      <div class="relative flex flex-col gap-7">
        <div class="flex items-center gap-3">
          <div class="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center">
            <svg viewBox="0 0 20 20" width="22" height="22" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2 3 5v5c0 4.2 3 6.8 7 8 4-1.2 7-3.8 7-8V5l-7-3Z"/><path d="M7 10l2 2 4-4"/></svg>
          </div>
          <div>
            <div class="text-base font-bold leading-tight">ระบบประเมินบุคลากร</div>
            <div class="text-[11px] tracking-wide text-white/65">PERSONNEL EVALUATION SYSTEM</div>
          </div>
        </div>

        <div class="max-w-sm">
          <h1 class="text-2xl font-bold leading-snug mb-3">ประเมินผลการปฏิบัติงาน<br />อย่างเป็นระบบและโปร่งใส</h1>
          <p class="text-sm leading-relaxed text-white/75">
            ศูนย์กลางการบริหารจัดการตัวชี้วัด การประเมินตนเอง และการให้คะแนนโดยกรรมการ ในที่เดียว
          </p>
        </div>
      </div>

      <div class="relative text-xs text-white/55">[ชื่อสถานศึกษา] · ปีการศึกษา 2569</div>
    </div>

    <!-- ===== right: login form ===== -->
    <div class="flex-[999] basis-[420px] min-w-0 flex items-center justify-center px-6 py-10">
      <div class="w-full max-w-sm">
        <div class="mb-8">
          <div class="text-sm font-semibold text-panel-b mb-2">เข้าสู่ระบบ</div>
          <h2 class="text-2xl font-bold text-ink mb-2">ยินดีต้อนรับกลับมา</h2>
          <p class="text-sm text-ink-soft">สำหรับฝ่ายบุคลากร ผู้รับการประเมิน และกรรมการผู้ประเมิน</p>
        </div>

        <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
          <div v-if="errorMessage" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {{ errorMessage }}
          </div>

          <div class="flex flex-col gap-2">
            <label for="username" class="text-sm font-semibold text-ink">ชื่อผู้ใช้งาน (Username)</label>
            <input
              id="username"
              v-model="username"
              type="text"
              autocomplete="username"
              placeholder="กรอกชื่อผู้ใช้งาน"
              class="input input-bordered w-full"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label for="password" class="text-sm font-semibold text-ink">รหัสผ่าน (Password)</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="กรอกรหัสผ่าน"
                class="input input-bordered w-full pr-11"
              />
              <button
                type="button"
                class="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-ink-soft"
                aria-label="แสดง/ซ่อนรหัสผ่าน"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z"/><circle cx="10" cy="10" r="2.5"/></svg>
                <svg v-else viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M1.5 10S4.5 4.5 10 4.5c1.6 0 3 .4 4.2 1M18.5 10S15.5 15.5 10 15.5c-1.6 0-3-.4-4.2-1"/><path d="M3 3l14 14"/></svg>
              </button>
            </div>
          </div>

          <div class="flex items-center justify-between -mt-1">
            <label class="flex items-center gap-2 text-sm text-ink-soft cursor-pointer">
              <input v-model="remember" type="checkbox" class="checkbox checkbox-sm" style="accent-color:#1f4e8c" />
              จดจำการเข้าสู่ระบบ
            </label>
            <a href="#" class="text-sm font-semibold text-panel-b">ลืมรหัสผ่าน?</a>
          </div>

          <button type="submit" class="btn w-full text-white border-none mt-1" style="background:#1f4e8c" :disabled="loading">
            <span v-if="loading" class="loading loading-spinner loading-sm"></span>
            เข้าสู่ระบบ
          </button>

          <div class="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-3 mt-1">
            <svg class="flex-none text-accent-warm mt-0.5" viewBox="0 0 20 20" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="7.5"/><path d="M10 9v4.5M10 6.7v.1"/></svg>
            <div class="text-xs leading-relaxed text-amber-900">
              เข้าสู่ระบบครั้งแรก? ระบบจะให้ท่านตั้งรหัสผ่านใหม่ทันทีเพื่อความปลอดภัย
            </div>
          </div>
        </form>

        <div class="mt-7 text-center text-xs text-ink-soft">มีปัญหาการเข้าสู่ระบบ? ติดต่อฝ่ายบุคลากร</div>
      </div>
    </div>
  </div>
</template>
