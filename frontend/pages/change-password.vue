<script setup>
import { ref } from "vue";

const authStore = useAuthStore();
const currentPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const loading = ref(false);

async function handleSubmit() {
  errorMessage.value = "";
  if (newPassword.value.length < 8) {
    errorMessage.value = "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร";
    return;
  }
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = "ยืนยันรหัสผ่านไม่ตรงกัน";
    return;
  }
  loading.value = true;
  try {
    await authStore.changePassword({ currentPassword: currentPassword.value, newPassword: newPassword.value });
    await navigateTo(authStore.roleHome);
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "เปลี่ยนรหัสผ่านไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-brand-bg px-6">
    <div class="card bg-base-100 border border-gray-200 w-full max-w-md p-8 rounded-2xl shadow-sm">
      <div class="mb-6">
        <h1 class="text-xl font-bold text-ink mb-1">ตั้งรหัสผ่านใหม่</h1>
        <p class="text-sm text-ink-soft">เข้าสู่ระบบครั้งแรก — กรุณาเปลี่ยนรหัสผ่านก่อนใช้งานต่อ</p>
      </div>

      <form class="flex flex-col gap-4" @submit.prevent="handleSubmit">
        <div v-if="errorMessage" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {{ errorMessage }}
        </div>

        <div v-if="!authStore.user?.isFirstLogin" class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-ink">รหัสผ่านเดิม</label>
          <input v-model="currentPassword" type="password" class="input input-bordered w-full" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-ink">รหัสผ่านใหม่</label>
          <input v-model="newPassword" type="password" class="input input-bordered w-full" placeholder="อย่างน้อย 8 ตัวอักษร" />
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-sm font-semibold text-ink">ยืนยันรหัสผ่านใหม่</label>
          <input v-model="confirmPassword" type="password" class="input input-bordered w-full" />
        </div>

        <button type="submit" class="btn w-full text-white border-none mt-2" style="background:#1f4e8c" :disabled="loading">
          <span v-if="loading" class="loading loading-spinner loading-sm"></span>
          บันทึกรหัสผ่านใหม่
        </button>
      </form>
    </div>
  </div>
</template>
