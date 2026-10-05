<script setup>
const { navItems } = useNav();
const api = useApi();
const authStore = useAuthStore();
const report = ref(null);
const comments = ref([]);
const loading = ref(true);
const downloading = ref(false);

async function load() {
  loading.value = true;
  const myId = authStore.user.id;
  const [reportRes, assignmentsRes] = await Promise.all([
    api.get(`/evaluatees/${myId}/report`),
    api.get("/assignments"),
  ]);
  report.value = reportRes.data.data;
  comments.value = assignmentsRes.data.data.filter((a) => a.overallComment);
  loading.value = false;
}

async function downloadPdf() {
  downloading.value = true;
  try {
    const response = await api.get(`/evaluatees/${authStore.user.id}/report/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-report.pdf";
    link.click();
    window.URL.revokeObjectURL(url);
  } finally {
    downloading.value = false;
  }
}

function initials(name) {
  if (!name) return "?";
  const p = name.trim().split(/\s+/);
  return (p[0]?.[0] || "") + (p[1]?.[0] || "");
}

onMounted(load);
</script>

<template>
  <AppShell :nav-items="navItems">
    <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
      <div>
        <h1 class="text-xl font-bold text-ink mb-1">รายงานของฉัน</h1>
        <p class="text-sm text-ink-soft">ผลการประเมินและความคิดเห็นจากกรรมการ</p>
      </div>
      <button class="btn text-white border-none" style="background:#1f4e8c" :disabled="downloading" @click="downloadPdf">
        <span v-if="downloading" class="loading loading-spinner loading-sm"></span>
        Export PDF
      </button>
    </div>

    <div v-if="loading" class="text-sm text-ink-soft">กำลังโหลดข้อมูล...</div>

    <template v-else>
      <div class="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
        <h2 class="text-sm font-bold mb-4">ผลคะแนนรายตัวชี้วัด</h2>
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200">
              <th class="pb-2 pr-3">หัวข้อ</th>
              <th class="pb-2 pr-3">ตัวชี้วัด</th>
              <th class="pb-2 pr-3">น้ำหนัก</th>
              <th class="pb-2 pr-3">คะแนนตนเอง</th>
              <th class="pb-2">คะแนนกรรมการ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(r, idx) in report.rows" :key="idx" class="border-b border-gray-100 last:border-0">
              <td class="py-2 pr-3 text-ink-soft">{{ r.topicName }}</td>
              <td class="py-2 pr-3 font-medium">{{ r.indicatorName }}</td>
              <td class="py-2 pr-3 tabular-nums">{{ r.weight }}%</td>
              <td class="py-2 pr-3 tabular-nums">{{ r.selfScore ?? "-" }}</td>
              <td class="py-2 tabular-nums">{{ r.committeeScore ?? "-" }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 class="text-sm font-bold mb-4">ความคิดเห็นจากกรรมการ</h2>
        <div v-for="c in comments" :key="c.id" class="flex gap-3 items-start p-4 rounded-xl mb-3 last:mb-0" style="background:#f7ecd9;border:1px solid #e9d4ae;">
          <div class="flex-none w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style="background:#e9d4ae;color:#b5792a;">{{ initials(c.evaluatorName) }}</div>
          <div class="min-w-0">
            <div class="text-xs font-bold text-ink mb-1">{{ c.evaluatorName }} <span class="font-medium text-ink-soft">· {{ c.committeeRole === "chair" ? "ประธานกรรมการ" : "กรรมการร่วม" }}</span></div>
            <div class="text-xs leading-relaxed" style="color:#6b5330;">{{ c.overallComment }}</div>
          </div>
        </div>
        <div v-if="!comments.length" class="text-sm text-ink-soft text-center py-4">ยังไม่มีความคิดเห็นจากกรรมการ</div>
      </div>
    </template>
  </AppShell>
</template>
