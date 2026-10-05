<script setup>
const navItems = [
  { label: "แดชบอร์ด", to: "/dashboard", icon: "grid" },
  { label: "หัวข้อการประเมิน", to: "/hr/topics", icon: "doc" },
  { label: "ผู้รับการประเมิน", to: "/hr/evaluatees", icon: "people" },
  { label: "กรรมการผู้ประเมิน", to: "/hr/evaluators", icon: "judge" },
  { label: "รายงาน", to: "/hr/reports", icon: "bars" },
];

const api = useApi();
const topics = ref([]);
const indicators = ref([]);
const selectedTopicId = ref(null);
const loadingTopics = ref(true);
const loadingIndicators = ref(false);
const errorMessage = ref("");

const showTopicForm = ref(false);
const topicForm = reactive({ name: "", description: "", startDate: "", endDate: "" });

const EMPTY_INDICATOR = () => ({
  name: "", description: "", weight: 10, scoreType: "scale_1_4",
  evidenceTypes: [], level1Desc: "ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวังมาก",
  level2Desc: "ปฏิบัติได้ต่ำกว่าระดับการปฏิบัติที่คาดหวัง",
  level3Desc: "ปฏิบัติได้ตามระดับการปฏิบัติที่คาดหวัง",
  level4Desc: "ปฏิบัติได้สูงกว่าระดับการปฏิบัติที่คาดหวัง",
});
const indicatorForm = reactive(EMPTY_INDICATOR());

const selectedTopic = computed(() => topics.value.find((t) => t.id === selectedTopicId.value));

async function loadTopics() {
  loadingTopics.value = true;
  try {
    const { data } = await api.get("/topics");
    topics.value = data.data;
    if (!selectedTopicId.value && topics.value.length) selectedTopicId.value = topics.value[0].id;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "โหลดหัวข้อการประเมินไม่สำเร็จ";
  } finally {
    loadingTopics.value = false;
  }
}

async function loadIndicators() {
  if (!selectedTopicId.value) return;
  loadingIndicators.value = true;
  try {
    const { data } = await api.get(`/topics/${selectedTopicId.value}/indicators`);
    indicators.value = data.data;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "โหลดตัวชี้วัดไม่สำเร็จ";
  } finally {
    loadingIndicators.value = false;
  }
}

watch(selectedTopicId, loadIndicators);

async function submitTopic() {
  try {
    await api.post("/topics", topicForm);
    Object.assign(topicForm, { name: "", description: "", startDate: "", endDate: "" });
    showTopicForm.value = false;
    await loadTopics();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "สร้างหัวข้อการประเมินไม่สำเร็จ";
  }
}

async function removeTopic(id) {
  if (!confirm("ยืนยันการลบหัวข้อการประเมินนี้?")) return;
  await api.delete(`/topics/${id}`);
  if (selectedTopicId.value === id) selectedTopicId.value = null;
  await loadTopics();
}

async function submitIndicator() {
  try {
    await api.post(`/topics/${selectedTopicId.value}/indicators`, indicatorForm);
    Object.assign(indicatorForm, EMPTY_INDICATOR());
    await loadIndicators();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "เพิ่มตัวชี้วัดไม่สำเร็จ";
  }
}

async function removeIndicator(id) {
  if (!confirm("ยืนยันการลบตัวชี้วัดนี้?")) return;
  await api.delete(`/indicators/${id}`);
  await loadIndicators();
}

function toggleEvidence(type) {
  const i = indicatorForm.evidenceTypes.indexOf(type);
  if (i >= 0) indicatorForm.evidenceTypes.splice(i, 1);
  else indicatorForm.evidenceTypes.push(type);
}

onMounted(loadTopics);
</script>

<template>
  <AppShell :nav-items="navItems">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-ink mb-1">งานบุคลากร</h1>
      <p class="text-sm text-ink-soft">จัดการหัวข้อ ตัวชี้วัด และกรอบการประเมินของระบบ</p>
    </div>

    <div v-if="errorMessage" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{{ errorMessage }}</div>

    <div class="flex flex-wrap gap-5 items-start">
      <!-- ===== topic list ===== -->
      <div class="flex-1 basis-[300px] min-w-[270px] flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-bold">หัวข้อการประเมินทั้งหมด</h2>
          <button class="btn btn-sm text-white border-none" style="background:#1f4e8c" @click="showTopicForm = !showTopicForm">
            + เพิ่มหัวข้อ
          </button>
        </div>

        <form v-if="showTopicForm" class="bg-white border border-gray-200 rounded-xl p-3.5 flex flex-col gap-2.5" @submit.prevent="submitTopic">
          <input v-model="topicForm.name" required placeholder="ชื่อหัวข้อการประเมิน" class="input input-bordered input-sm w-full" />
          <textarea v-model="topicForm.description" placeholder="รายละเอียด (ถ้ามี)" class="textarea textarea-bordered textarea-sm w-full" rows="2"></textarea>
          <div class="flex gap-2">
            <input v-model="topicForm.startDate" type="date" required class="input input-bordered input-sm w-full" />
            <input v-model="topicForm.endDate" type="date" required class="input input-bordered input-sm w-full" />
          </div>
          <button type="submit" class="btn btn-sm text-white border-none" style="background:#1f4e8c">บันทึก</button>
        </form>

        <div v-if="loadingTopics" class="text-sm text-ink-soft">กำลังโหลด...</div>
        <button
          v-for="t in topics"
          :key="t.id"
          class="text-left border rounded-xl p-4 transition"
          :class="t.id === selectedTopicId ? 'border-[#1f4e8c] bg-[#e7eff9]' : 'border-gray-200 bg-white hover:bg-gray-50'"
          @click="selectedTopicId = t.id"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="text-sm font-bold">{{ t.name }}</div>
            <span
              class="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-none"
              :class="t.status === 'open' ? 'bg-[#e7eff9] text-[#2f6bb0]' : 'bg-gray-100 text-gray-500'"
            >
              {{ t.status === "open" ? "กำลังเปิดรับ" : t.status === "draft" ? "ร่าง" : "ปิดรับแล้ว" }}
            </span>
          </div>
          <div class="text-xs text-ink-soft mt-1.5">{{ t.startDate }} – {{ t.endDate }} · {{ t.indicatorCount }} ตัวชี้วัด</div>
        </button>
      </div>

      <!-- ===== indicators + form ===== -->
      <div class="flex-[2] basis-[560px] min-w-0 flex flex-col gap-4" v-if="selectedTopic">
        <div class="bg-white border border-gray-200 rounded-2xl p-5">
          <div class="flex items-start justify-between gap-3 mb-4">
            <div>
              <div class="flex items-center gap-2 mb-1">
                <h2 class="text-lg font-bold">{{ selectedTopic.name }}</h2>
              </div>
              <div class="text-xs text-ink-soft">{{ selectedTopic.startDate }} – {{ selectedTopic.endDate }}</div>
            </div>
            <button class="btn btn-sm btn-outline border-gray-300 text-red-600" @click="removeTopic(selectedTopic.id)">ลบหัวข้อ</button>
          </div>

          <h3 class="text-sm font-bold mb-3">ตัวชี้วัด ({{ indicators.length }})</h3>
          <div v-if="loadingIndicators" class="text-sm text-ink-soft">กำลังโหลด...</div>
          <div v-else class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200">
                  <th class="pb-2 pr-3">ชื่อตัวชี้วัด</th>
                  <th class="pb-2 pr-3">น้ำหนัก</th>
                  <th class="pb-2 pr-3">รูปแบบ</th>
                  <th class="pb-2 pr-3">หลักฐาน</th>
                  <th class="pb-2"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="i in indicators" :key="i.id" class="border-b border-gray-100 last:border-0">
                  <td class="py-2.5 pr-3 font-medium">{{ i.name }}</td>
                  <td class="py-2.5 pr-3 tabular-nums">{{ i.weight }}%</td>
                  <td class="py-2.5 pr-3">
                    <span class="text-xs bg-gray-100 text-ink-soft px-2 py-0.5 rounded-full">{{ i.scoreType === "scale_1_4" ? "สเกล 1–4" : "มี / ไม่มี" }}</span>
                  </td>
                  <td class="py-2.5 pr-3 text-ink-soft">{{ i.evidenceTypes || "-" }}</td>
                  <td class="py-2.5">
                    <button class="text-red-600 text-xs font-semibold" @click="removeIndicator(i.id)">ลบ</button>
                  </td>
                </tr>
                <tr v-if="!indicators.length">
                  <td colspan="5" class="py-6 text-center text-ink-soft">ยังไม่มีตัวชี้วัดในหัวข้อนี้</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- add indicator form -->
        <form class="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col gap-4" @submit.prevent="submitIndicator">
          <h3 class="text-sm font-bold">เพิ่มตัวชี้วัดใหม่</h3>

          <div>
            <label class="text-sm font-semibold text-ink block mb-1.5">ชื่อตัวชี้วัด</label>
            <input v-model="indicatorForm.name" required placeholder="เช่น การจัดทำแผนการสอนรายวิชา" class="input input-bordered w-full" />
          </div>

          <div>
            <label class="text-sm font-semibold text-ink block mb-1.5">รายละเอียด</label>
            <textarea v-model="indicatorForm.description" rows="2" class="textarea textarea-bordered w-full"></textarea>
          </div>

          <div class="flex gap-4 flex-wrap">
            <div class="flex-1 basis-[160px]">
              <label class="text-sm font-semibold text-ink block mb-1.5">น้ำหนักคะแนน (%)</label>
              <input v-model.number="indicatorForm.weight" type="number" min="0" max="100" required class="input input-bordered w-full" />
            </div>
            <div class="flex-[2] basis-[260px]">
              <label class="text-sm font-semibold text-ink block mb-1.5">หลักฐานที่ใช้แนบ</label>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-for="type in ['pdf', 'image', 'url']" :key="type" type="button"
                  class="px-3.5 py-1.5 rounded-lg border text-sm font-semibold"
                  :class="indicatorForm.evidenceTypes.includes(type) ? 'border-[#1f4e8c] bg-[#e7eff9] text-[#1f4e8c]' : 'border-gray-300 text-ink-soft'"
                  @click="toggleEvidence(type)"
                >
                  {{ { pdf: "PDF", image: "รูปภาพ", url: "URL" }[type] }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label class="text-sm font-semibold text-ink block mb-1.5">รูปแบบการประเมิน</label>
            <div class="flex gap-2.5 flex-wrap mb-3">
              <label
                class="flex-1 basis-[180px] px-3.5 py-3 rounded-lg border cursor-pointer flex items-center gap-2.5"
                :class="indicatorForm.scoreType === 'yesno' ? 'border-[#1f4e8c] bg-[#e7eff9]' : 'border-gray-300'"
              >
                <input v-model="indicatorForm.scoreType" type="radio" value="yesno" class="radio radio-sm" />
                <span class="text-sm" :class="indicatorForm.scoreType === 'yesno' ? 'font-semibold text-[#1f4e8c]' : 'text-ink-soft'">ตัวเลือก "มี / ไม่มี"</span>
              </label>
              <label
                class="flex-1 basis-[180px] px-3.5 py-3 rounded-lg border cursor-pointer flex items-center gap-2.5"
                :class="indicatorForm.scoreType === 'scale_1_4' ? 'border-[#1f4e8c] bg-[#e7eff9]' : 'border-gray-300'"
              >
                <input v-model="indicatorForm.scoreType" type="radio" value="scale_1_4" class="radio radio-sm" />
                <span class="text-sm" :class="indicatorForm.scoreType === 'scale_1_4' ? 'font-semibold text-[#1f4e8c]' : 'text-ink-soft'">สเกลคะแนน 1–4</span>
              </label>
            </div>

            <div v-if="indicatorForm.scoreType === 'scale_1_4'" class="flex flex-col gap-2 bg-brand-bg border border-gray-200 rounded-lg p-4">
              <div v-for="n in 4" :key="n" class="flex gap-2.5 items-start">
                <span class="text-xs font-semibold bg-white border border-gray-200 text-ink-soft px-2 py-0.5 rounded-full flex-none mt-0.5">ระดับ {{ n }}</span>
                <input v-model="indicatorForm[`level${n}Desc`]" class="input input-bordered input-sm w-full" />
              </div>
            </div>
          </div>

          <div class="flex justify-end">
            <button type="submit" class="btn text-white border-none" style="background:#1f4e8c">บันทึกตัวชี้วัด</button>
          </div>
        </form>
      </div>
    </div>
  </AppShell>
</template>
