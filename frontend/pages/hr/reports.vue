<script setup>
const { navItems } = useNav();
const api = useApi();
const evaluatees = ref([]);
const expandedId = ref(null);
const reportData = ref(null);
const downloadingId = ref(null);

async function load() {
  const { data } = await api.get("/users", { params: { role: "evaluatee" } });
  evaluatees.value = data.data;
}

async function toggleReport(id) {
  if (expandedId.value === id) {
    expandedId.value = null;
    return;
  }
  const { data } = await api.get(`/evaluatees/${id}/report`);
  reportData.value = data.data;
  expandedId.value = id;
}

// endpoint PDF ต้องแนบ JWT header จึงดาวน์โหลดผ่าน axios (responseType: blob) แทนลิงก์ตรง
async function downloadPdf(id) {
  downloadingId.value = id;
  try {
    const response = await api.get(`/evaluatees/${id}/report/pdf`, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `report-${id}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  } finally {
    downloadingId.value = null;
  }
}

onMounted(load);
</script>

<template>
  <AppShell :nav-items="navItems">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-ink mb-1">รายงานผลการประเมิน</h1>
      <p class="text-sm text-ink-soft">ดูและส่งออกรายงานผลการประเมินรายบุคคล</p>
    </div>

    <div class="bg-white border border-gray-200 rounded-2xl divide-y divide-gray-100">
      <div v-for="e in evaluatees" :key="e.id">
        <div class="flex items-center justify-between px-5 py-4">
          <div>
            <div class="font-semibold text-sm">{{ e.fullName }}</div>
            <div class="text-xs text-ink-soft">{{ e.department || "-" }}</div>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-sm btn-outline border-gray-300" @click="toggleReport(e.id)">
              {{ expandedId === e.id ? "ซ่อนรายงาน" : "ดูรายงาน" }}
            </button>
            <button class="btn btn-sm text-white border-none" style="background:#1f4e8c" :disabled="downloadingId === e.id" @click="downloadPdf(e.id)">
              <span v-if="downloadingId === e.id" class="loading loading-spinner loading-xs"></span>
              Export PDF
            </button>
          </div>
        </div>

        <div v-if="expandedId === e.id && reportData" class="px-5 pb-5">
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
              <tr v-for="(r, idx) in reportData.rows" :key="idx" class="border-b border-gray-100 last:border-0">
                <td class="py-2 pr-3 text-ink-soft">{{ r.topicName }}</td>
                <td class="py-2 pr-3 font-medium">{{ r.indicatorName }}</td>
                <td class="py-2 pr-3 tabular-nums">{{ r.weight }}%</td>
                <td class="py-2 pr-3 tabular-nums">{{ r.selfScore ?? "-" }}</td>
                <td class="py-2 tabular-nums">{{ r.committeeScore ?? "-" }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div v-if="!evaluatees.length" class="py-8 text-center text-ink-soft text-sm">ยังไม่มีข้อมูล</div>
    </div>
  </AppShell>
</template>
