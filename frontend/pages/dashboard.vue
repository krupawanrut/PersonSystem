<script setup>
const { navItems } = useNav();
const api = useApi();
const loading = ref(true);
const errorMessage = ref("");
const summary = ref(null);
const assignments = ref([]);

const STATUS_LABEL = { not_started: "ยังไม่ได้ประเมิน", draft: "กำลังประเมิน (ร่าง)", confirmed: "ยืนยันแล้ว" };
const STATUS_COLOR = { not_started: "#5f6b7a", draft: "#c17f1f", confirmed: "#2f6bb0" };

async function load() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const [summaryRes, assignmentsRes] = await Promise.all([
      api.get("/reports/summary"),
      api.get("/assignments"),
    ]);
    summary.value = summaryRes.data.data;
    assignments.value = assignmentsRes.data.data;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}

const statusTotal = computed(() => {
  if (!summary.value) return 0;
  const s = summary.value.statusBreakdown;
  return s.not_started + s.draft + s.confirmed;
});
function pct(count) {
  return statusTotal.value ? Math.round((count / statusTotal.value) * 100) : 0;
}

onMounted(load);
</script>

<template>
  <AppShell :nav-items="navItems">
    <div class="flex items-center justify-between flex-wrap gap-4 mb-6">
      <div>
        <h1 class="text-xl font-bold text-ink mb-1">ภาพรวมระบบ</h1>
        <p class="text-sm text-ink-soft">สรุปสถานะการประเมินของระบบในรอบปัจจุบัน</p>
      </div>
    </div>

    <div v-if="loading" class="text-sm text-ink-soft">กำลังโหลดข้อมูล...</div>
    <div v-else-if="errorMessage" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{{ errorMessage }}</div>

    <template v-else-if="summary">
      <!-- stat tiles -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div class="bg-white border border-gray-200 rounded-2xl p-5">
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">ผู้รับการประเมิน</div>
          <div class="text-3xl font-bold tabular-nums">{{ summary.evaluateeCount }} <span class="text-sm font-medium text-ink-soft">คน</span></div>
        </div>
        <div class="bg-white border border-gray-200 rounded-2xl p-5">
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">กรรมการผู้ประเมิน</div>
          <div class="text-3xl font-bold tabular-nums">{{ summary.evaluatorCount }} <span class="text-sm font-medium text-ink-soft">คน</span></div>
        </div>
        <div class="bg-white border border-gray-200 rounded-2xl p-5">
          <div class="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">ความคืบหน้ารวม</div>
          <div class="text-3xl font-bold tabular-nums">{{ summary.overallProgress }}<span class="text-lg">%</span></div>
          <div class="h-2 rounded-full bg-gray-100 overflow-hidden mt-2">
            <div class="h-full rounded-full" style="background:#2f6bb0" :style="{ width: summary.overallProgress + '%' }"></div>
          </div>
        </div>
      </div>

      <!-- status breakdown + topic progress -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div class="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 class="text-sm font-bold mb-4">สถานะการประเมินของกรรมการ</h2>
          <div class="flex h-3.5 rounded-full overflow-hidden gap-0.5">
            <div style="background:#2f6bb0" :style="{ width: pct(summary.statusBreakdown.confirmed) + '%' }"></div>
            <div style="background:#c17f1f" :style="{ width: pct(summary.statusBreakdown.draft) + '%' }"></div>
            <div style="background:#5f6b7a" :style="{ width: pct(summary.statusBreakdown.not_started) + '%' }"></div>
          </div>
          <div class="flex flex-wrap gap-4 mt-4">
            <div v-for="key in ['confirmed', 'draft', 'not_started']" :key="key" class="flex items-center gap-2 text-xs">
              <span class="w-2.5 h-2.5 rounded" :style="{ background: STATUS_COLOR[key] }"></span>
              <span class="text-ink-soft">{{ STATUS_LABEL[key] }}</span>
              <span class="font-bold tabular-nums">{{ summary.statusBreakdown[key] }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-2xl p-5">
          <h2 class="text-sm font-bold mb-4">ความคืบหน้าแยกตามหัวข้อ</h2>
          <div class="flex flex-col gap-3.5">
            <div v-for="t in summary.topicProgress" :key="t.id">
              <div class="flex justify-between text-xs mb-1.5">
                <span>{{ t.name }}</span>
                <span class="font-bold tabular-nums">{{ t.percent }}%</span>
              </div>
              <div class="h-2 rounded-full bg-gray-100 overflow-hidden">
                <div class="h-full rounded-full" style="background:#1f4e8c" :style="{ width: t.percent + '%' }"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- assignments table -->
      <div class="bg-white border border-gray-200 rounded-2xl p-5">
        <h2 class="text-sm font-bold mb-4">การมอบหมายล่าสุด</h2>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200">
                <th class="pb-2 pr-3">กรรมการ</th>
                <th class="pb-2 pr-3">ผู้รับการประเมิน</th>
                <th class="pb-2 pr-3">บทบาท</th>
                <th class="pb-2">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in assignments" :key="a.id" class="border-b border-gray-100 last:border-0">
                <td class="py-2.5 pr-3 font-medium">{{ a.evaluatorName }}</td>
                <td class="py-2.5 pr-3">{{ a.evaluateeName }}</td>
                <td class="py-2.5 pr-3 text-ink-soft">{{ a.committeeRole === "chair" ? "ประธานกรรมการ" : "กรรมการร่วม" }}</td>
                <td class="py-2.5">
                  <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :style="{ color: STATUS_COLOR[a.status], background: STATUS_COLOR[a.status] + '1a' }">
                    {{ STATUS_LABEL[a.status] }}
                  </span>
                </td>
              </tr>
              <tr v-if="!assignments.length">
                <td colspan="4" class="py-6 text-center text-ink-soft">ยังไม่มีการมอบหมาย</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </AppShell>
</template>
