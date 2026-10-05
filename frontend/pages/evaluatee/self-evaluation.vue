<script setup>
const navItems = [
  { label: "การประเมินตนเอง", to: "/evaluatee/self-evaluation", icon: "doc" },
  { label: "รายงานของฉัน", to: "/evaluatee/report", icon: "award" },
];

const api = useApi();
const authStore = useAuthStore();

const topics = ref([]); // [{ ...topic, indicators: [...] }]
const selectedIndicatorId = ref(null);
const details = ref([]);
const selfScore = ref(null);
const newDetailText = ref("");
const evidenceUrl = ref("");
const loading = ref(true);
const errorMessage = ref("");
const savingScore = ref(false);

const allIndicators = computed(() => topics.value.flatMap((t) => t.indicators));
const selectedIndicator = computed(() => allIndicators.value.find((i) => i.id === selectedIndicatorId.value));

const totalCount = computed(() => allIndicators.value.length);
const filledCount = computed(() => allIndicators.value.filter((i) => i.hasEntry).length);
const progressPercent = computed(() => (totalCount.value ? Math.round((filledCount.value / totalCount.value) * 100) : 0));

async function loadAll() {
  loading.value = true;
  try {
    const { data: topicsRes } = await api.get("/topics");
    const withIndicators = await Promise.all(
      topicsRes.data.map(async (t) => {
        const { data } = await api.get(`/topics/${t.id}/indicators`);
        return { ...t, indicators: data.data.map((i) => ({ ...i, hasEntry: false })) };
      })
    );
    topics.value = withIndicators;

    // ตรวจสอบว่าตัวชี้วัดใดมีรายละเอียดกรอกแล้วบ้าง (สำหรับแสดงสถานะและความคืบหน้า)
    await Promise.all(
      allIndicators.value.map(async (ind) => {
        const { data } = await api.get(`/indicators/${ind.id}/details`);
        ind.hasEntry = data.data.length > 0;
      })
    );

    if (!selectedIndicatorId.value && allIndicators.value.length) {
      selectedIndicatorId.value = allIndicators.value[0].id;
    }
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}

async function loadIndicatorDetail() {
  if (!selectedIndicatorId.value) return;
  const [detailsRes, scoreRes] = await Promise.all([
    api.get(`/indicators/${selectedIndicatorId.value}/details`),
    api.get(`/indicators/${selectedIndicatorId.value}/self-score`),
  ]);
  details.value = detailsRes.data.data;
  selfScore.value = scoreRes.data.data?.scoreValue ?? null;
}

watch(selectedIndicatorId, loadIndicatorDetail);

async function addDetail() {
  if (!newDetailText.value.trim()) return;
  await api.post(`/indicators/${selectedIndicatorId.value}/details`, { description: newDetailText.value });
  newDetailText.value = "";
  await loadIndicatorDetail();
  selectedIndicator.value.hasEntry = true;
}

async function removeDetail(id) {
  await api.delete(`/details/${id}`);
  await loadIndicatorDetail();
}

async function attachFile(detailId, event) {
  const file = event.target.files[0];
  if (!file) return;
  const formData = new FormData();
  formData.append("file", file);
  await api.post(`/details/${detailId}/evidence`, formData, { headers: { "Content-Type": "multipart/form-data" } });
  await loadIndicatorDetail();
}

async function attachUrl(detailId) {
  if (!evidenceUrl.value.trim()) return;
  await api.post(`/details/${detailId}/evidence`, { url: evidenceUrl.value });
  evidenceUrl.value = "";
  await loadIndicatorDetail();
}

async function setScore(level) {
  savingScore.value = true;
  try {
    await api.put(`/indicators/${selectedIndicatorId.value}/self-score`, { scoreValue: level });
    selfScore.value = level;
  } finally {
    savingScore.value = false;
  }
}

onMounted(loadAll);
</script>

<template>
  <AppShell :nav-items="navItems">
    <div class="flex items-center justify-between flex-wrap gap-4 mb-5">
      <div>
        <h1 class="text-xl font-bold text-ink mb-1">การประเมินตนเอง</h1>
        <p class="text-sm text-ink-soft">กรอกรายละเอียด แนบหลักฐาน และให้คะแนนตนเองในแต่ละตัวชี้วัด</p>
      </div>
    </div>

    <div v-if="errorMessage" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{{ errorMessage }}</div>
    <div v-if="loading" class="text-sm text-ink-soft">กำลังโหลดข้อมูล...</div>

    <template v-else>
      <!-- overall progress -->
      <div class="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-5 flex-wrap mb-5">
        <div>
          <div class="text-xs font-semibold text-gray-400 uppercase">ความคืบหน้ารวม</div>
          <div class="text-xl font-bold tabular-nums">{{ filledCount }} <span class="text-sm font-medium text-ink-soft">จาก {{ totalCount }} ตัวชี้วัด</span></div>
        </div>
        <div class="flex-1 min-w-[160px] h-2 rounded-full bg-gray-100 overflow-hidden">
          <div class="h-full rounded-full" style="background:#2f6bb0" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="text-xl font-bold tabular-nums" style="color:#2f6bb0">{{ progressPercent }}%</div>
      </div>

      <div class="flex flex-wrap gap-5 items-start">
        <!-- indicator list -->
        <div class="flex-1 basis-[300px] min-w-[270px] flex flex-col gap-4">
          <div v-for="topic in topics" :key="topic.id" class="bg-white border border-gray-200 rounded-2xl p-4">
            <div class="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2.5">{{ topic.name }}</div>
            <button
              v-for="ind in topic.indicators" :key="ind.id"
              class="w-full flex items-center gap-2.5 text-left px-2.5 py-2 rounded-lg"
              :class="ind.id === selectedIndicatorId ? 'border border-[#1f4e8c] bg-[#e7eff9]' : 'hover:bg-gray-50'"
              @click="selectedIndicatorId = ind.id"
            >
              <svg v-if="ind.hasEntry" width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#2f6bb0" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5l3.5 3.5L16 6"/></svg>
              <svg v-else width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="#9aa1ab" stroke-width="2" stroke-dasharray="2 3"><circle cx="10" cy="10" r="6.5"/></svg>
              <span class="flex-1 text-sm" :class="ind.id === selectedIndicatorId ? 'font-semibold' : ''">{{ ind.name }}</span>
              <span class="text-xs text-gray-400">{{ ind.weight }}%</span>
            </button>
          </div>
        </div>

        <!-- indicator detail -->
        <div v-if="selectedIndicator" class="flex-[2] basis-[560px] min-w-0 bg-white border border-gray-200 rounded-2xl p-5">
          <div class="flex items-start justify-between gap-3 mb-5">
            <div>
              <h2 class="text-lg font-bold mb-1">{{ selectedIndicator.name }}</h2>
              <p class="text-sm text-ink-soft">{{ selectedIndicator.description }}</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e7eff9] text-[#2f6bb0] flex-none">น้ำหนัก {{ selectedIndicator.weight }}%</span>
          </div>

          <!-- details -->
          <div class="mb-6">
            <h3 class="text-sm font-bold mb-3">รายละเอียดประกอบการประเมิน</h3>
            <div class="flex flex-col gap-2.5 mb-3">
              <div v-for="(d, idx) in details" :key="d.id" class="border border-gray-200 rounded-xl p-3.5 flex gap-3 items-start">
                <span class="flex-none w-5.5 h-5.5 rounded-md bg-[#e7eff9] text-[#1f4e8c] text-xs font-bold flex items-center justify-center">{{ idx + 1 }}</span>
                <div class="flex-1 min-w-0">
                  <div class="text-sm">{{ d.description }}</div>
                  <div class="mt-2 flex items-center gap-2 flex-wrap">
                    <span v-if="d.evidencePath" class="text-xs bg-gray-100 text-ink-soft px-2 py-1 rounded-lg">
                      {{ d.evidenceType === "url" ? d.evidencePath : d.evidencePath.split("/").pop() }}
                    </span>
                    <label class="text-xs font-semibold text-[#1f4e8c] cursor-pointer">
                      แนบไฟล์
                      <input type="file" class="hidden" accept=".pdf,.jpg,.jpeg,.png" @change="attachFile(d.id, $event)" />
                    </label>
                    <div class="flex items-center gap-1">
                      <input v-model="evidenceUrl" placeholder="หรือวาง URL" class="input input-bordered input-xs w-32" />
                      <button type="button" class="text-xs font-semibold text-[#1f4e8c]" @click="attachUrl(d.id)">แนบ</button>
                    </div>
                  </div>
                </div>
                <button class="flex-none text-gray-400 hover:text-red-600" @click="removeDetail(d.id)">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 5l10 10M15 5L5 15"/></svg>
                </button>
              </div>
              <div v-if="!details.length" class="text-sm text-ink-soft py-3 text-center border border-dashed border-gray-200 rounded-xl">ยังไม่มีรายละเอียด</div>
            </div>

            <div class="flex gap-2">
              <input v-model="newDetailText" placeholder="เพิ่มรายละเอียดประกอบการประเมิน" class="input input-bordered input-sm w-full" @keyup.enter="addDetail" />
              <button class="btn btn-sm text-white border-none flex-none" style="background:#1f4e8c" @click="addDetail">เพิ่ม</button>
            </div>
          </div>

          <!-- self score -->
          <div>
            <h3 class="text-sm font-bold mb-3">ให้คะแนนตนเอง</h3>
            <div v-if="selectedIndicator.scoreType === 'scale_1_4'" class="flex gap-2.5 flex-wrap">
              <button
                v-for="n in 4" :key="n" type="button" :disabled="savingScore"
                class="flex-1 basis-[140px] text-left px-3.5 py-3 rounded-lg border"
                :class="selfScore === n ? 'border-[#1f4e8c] bg-[#e7eff9]' : 'border-gray-200'"
                @click="setScore(n)"
              >
                <div class="text-xs font-bold" :class="selfScore === n ? 'text-[#1f4e8c]' : 'text-gray-400'">ระดับ {{ n }} <span v-if="selfScore === n">✓</span></div>
                <div class="text-xs mt-0.5" :class="selfScore === n ? 'text-[#1f4e8c]' : 'text-ink-soft'">
                  {{ [selectedIndicator.level1Desc, selectedIndicator.level2Desc, selectedIndicator.level3Desc, selectedIndicator.level4Desc][n - 1] }}
                </div>
              </button>
            </div>
            <div v-else class="flex gap-2.5">
              <button
                v-for="opt in [{ v: 1, label: 'มี' }, { v: 0, label: 'ไม่มี' }]" :key="opt.v"
                class="px-5 py-2.5 rounded-lg border text-sm font-semibold"
                :class="selfScore === opt.v ? 'border-[#1f4e8c] bg-[#e7eff9] text-[#1f4e8c]' : 'border-gray-200 text-ink-soft'"
                @click="setScore(opt.v)"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </AppShell>
</template>
