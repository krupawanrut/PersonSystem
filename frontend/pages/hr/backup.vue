<script setup>
const { navItems } = useNav();
const api = useApi();

const downloading = ref(false);
const restoring = ref(false);
const selectedFile = ref(null);
const message = ref(null); // { type: 'success' | 'error', text }

async function downloadBackup() {
  downloading.value = true;
  message.value = null;
  try {
    const response = await api.get("/admin/backup", { responseType: "blob" });
    const blob = new Blob([response.data], { type: "application/sql" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    link.href = url;
    link.download = `backup-${stamp}.sql`;
    link.click();
    window.URL.revokeObjectURL(url);
    message.value = { type: "success", text: "ดาวน์โหลดไฟล์สำรองข้อมูลสำเร็จ" };
  } catch (err) {
    message.value = { type: "error", text: err.response?.data?.message || "สำรองข้อมูลไม่สำเร็จ" };
  } finally {
    downloading.value = false;
  }
}

function onFileChange(e) {
  selectedFile.value = e.target.files[0] || null;
}

async function restoreBackup() {
  if (!selectedFile.value) return;
  const ok = confirm(
    `ยืนยันการกู้คืนข้อมูลจากไฟล์ "${selectedFile.value.name}" ใช่หรือไม่?\n\nการกระทำนี้จะเขียนทับข้อมูลปัจจุบันทั้งหมดในระบบ และไม่สามารถย้อนกลับได้`
  );
  if (!ok) return;

  restoring.value = true;
  message.value = null;
  try {
    const formData = new FormData();
    formData.append("file", selectedFile.value);
    const { data } = await api.post("/admin/restore", formData, { headers: { "Content-Type": "multipart/form-data" } });
    message.value = { type: "success", text: data.message };
    selectedFile.value = null;
  } catch (err) {
    message.value = { type: "error", text: err.response?.data?.message || "กู้คืนข้อมูลไม่สำเร็จ" };
  } finally {
    restoring.value = false;
  }
}
</script>

<template>
  <AppShell :nav-items="navItems">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-ink mb-1">สำรองและกู้คืนข้อมูล</h1>
      <p class="text-sm text-ink-soft">สำรองฐานข้อมูลทั้งระบบเป็นไฟล์ .sql หรือกู้คืนจากไฟล์สำรองที่เคยบันทึกไว้</p>
    </div>

    <div
      v-if="message"
      class="text-sm rounded-lg px-4 py-3 mb-5"
      :class="message.type === 'success' ? 'text-[#1f4e8c] bg-[#e7eff9] border border-[#cddcf0]' : 'text-red-700 bg-red-50 border border-red-200'"
    >
      {{ message.text }}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- backup -->
      <div class="bg-white border border-gray-200 rounded-2xl p-6">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-[#e7eff9] text-[#1f4e8c] flex items-center justify-center flex-none">
            <Icon name="download" :size="20" />
          </div>
          <h2 class="text-base font-bold">สำรองข้อมูล (Backup)</h2>
        </div>
        <p class="text-sm text-ink-soft leading-relaxed mb-5">
          ส่งออกข้อมูลทั้งหมดในระบบ (ผู้ใช้งาน, หัวข้อ, ตัวชี้วัด, การมอบหมาย, คะแนน ฯลฯ) เป็นไฟล์ .sql ไฟล์เดียว
          เก็บไว้เป็นหลักฐานหรือสำรองก่อนทำการเปลี่ยนแปลงข้อมูลสำคัญ
        </p>
        <button class="btn text-white border-none w-full" style="background:#1f4e8c" :disabled="downloading" @click="downloadBackup">
          <span v-if="downloading" class="loading loading-spinner loading-sm"></span>
          ดาวน์โหลดไฟล์สำรองข้อมูล
        </button>
      </div>

      <!-- restore -->
      <div class="bg-white border border-gray-200 rounded-2xl p-6">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-xl bg-amber-50 text-accent-warm flex items-center justify-center flex-none">
            <Icon name="upload" :size="20" />
          </div>
          <h2 class="text-base font-bold">กู้คืนข้อมูล (Restore)</h2>
        </div>
        <p class="text-sm text-ink-soft leading-relaxed mb-4">
          เลือกไฟล์ .sql ที่เคยสำรองไว้เพื่อกู้คืนข้อมูลกลับเข้าสู่ระบบ
        </p>

        <div class="flex gap-2.5 bg-amber-50 border border-amber-200 rounded-lg px-3.5 py-3 mb-4">
          <Icon name="warning" :size="17" class="flex-none text-accent-warm mt-0.5" />
          <div class="text-xs leading-relaxed text-amber-900">
            การกู้คืนข้อมูลจะ<strong>เขียนทับข้อมูลปัจจุบันทั้งหมด</strong>ในระบบ และไม่สามารถย้อนกลับได้
            แนะนำให้สำรองข้อมูลปัจจุบันไว้ก่อนดำเนินการ
          </div>
        </div>

        <input type="file" accept=".sql" class="file-input file-input-bordered file-input-sm w-full mb-4" @change="onFileChange" />

        <button
          class="btn w-full border-none"
          style="background:#b5792a;color:#fff;"
          :disabled="!selectedFile || restoring"
          :class="{ 'opacity-50': !selectedFile }"
          @click="restoreBackup"
        >
          <span v-if="restoring" class="loading loading-spinner loading-sm"></span>
          กู้คืนข้อมูลจากไฟล์นี้
        </button>
      </div>
    </div>
  </AppShell>
</template>
