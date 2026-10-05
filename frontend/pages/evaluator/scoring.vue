<script setup>
const { navItems } = useNav();
const api = useApi();

const assignments = ref([]);
const selectedId = ref(null);
const scoreData = ref(null);
const overallComment = ref("");
const signatureFile = ref(null);
const loading = ref(true);
const errorMessage = ref("");
const submitting = ref(false);
const expandedIndicatorId = ref(null);
const detailsCache = reactive({});

const STATUS_LABEL = { not_started: "ยังไม่ประเมิน", draft: "ร่าง", confirmed: "ยืนยันแล้ว" };
const STATUS_STYLE = {
  not_started: "background:#eceef0;color:#5f6b7a;",
  draft: "background:#faeedb;color:#c17f1f;",
  confirmed: "background:#e7eff9;color:#2f6bb0;",
};

const selectedAssignment = computed(() => assignments.value.find((a) => a.id === selectedId.value));

async function loadAssignments() {
  loading.value = true;
  try {
    const { data } = await api.get("/assignments");
    assignments.value = data.data;
    if (!selectedId.value && assignments.value.length) selectedId.value = assignments.value[0].id;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}

async function loadScores() {
  if (!selectedId.value) return;
  const { data } = await api.get(`/assignments/${selectedId.value}/scores`);
  scoreData.value = data.data;
  overallComment.value = data.data.assignment.overallComment || "";
}

watch(selectedId, loadScores);

async function toggleDetails(indicatorId) {
  if (expandedIndicatorId.value === indicatorId) {
    expandedIndicatorId.value = null;
    return;
  }
  if (!detailsCache[indicatorId]) {
    const { data } = await api.get(`/indicators/${indicatorId}/details`, {
      params: { evaluateeId: selectedAssignment.value.evaluateeId },
    });
    detailsCache[indicatorId] = data.data;
  }
  expandedIndicatorId.value = indicatorId;
}

async function giveScore(indicatorId, value) {
  if (selectedAssignment.value.status === "confirmed") return;
  try {
    await api.put(`/assignments/${selectedId.value}/scores/${indicatorId}`, { scoreValue: value });
    await loadScores();
    await loadAssignments();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "บันทึกคะแนนไม่สำเร็จ";
  }
}

async function saveComment() {
  await api.put(`/assignments/${selectedId.value}/comment`, { overallComment: overallComment.value });
}

function onSignatureChange(e) {
  signatureFile.value = e.target.files[0] || null;
}

async function submitFinal() {
  if (!signatureFile.value) {
    errorMessage.value = "กรุณาแนบลายเซ็นก่อนยืนยันส่งผลการประเมิน";
    return;
  }
  submitting.value = true;
  errorMessage.value = "";
  try {
    await saveComment();
    const formData = new FormData();
    formData.append("signature", signatureFile.value);
    await api.post(`/assignments/${selectedId.value}/sign`, formData, { headers: { "Content-Type": "multipart/form-data" } });
    await loadScores();
    await loadAssignments();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "ยืนยันส่งผลไม่สำเร็จ";
  } finally {
    submitting.value = false;
  }
}

const averageScore = computed(() => {
  if (!scoreData.value) return null;
  const scored = scoreData.value.indicators.filter((i) => i.scoreValue !== null);
  if (!scored.length) return null;
  return (scored.reduce((sum, i) => sum + Number(i.scoreValue), 0) / scored.length).toFixed(1);
});

onMounted(loadAssignments);
</script>

<template>
  <AppShell :nav-items="navItems">
    <div class="mb-6">
      <h1 class="text-xl font-bold text-ink mb-1">ประเมินผู้รับการประเมิน</h1>
      <p class="text-sm text-ink-soft">ท่านได้รับมอบหมาย {{ assignments.length }} ท่าน</p>
    </div>

    <div v-if="errorMessage" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{{ errorMessage }}</div>
    <div v-if="loading" class="text-sm text-ink-soft">กำลังโหลดข้อมูล...</div>

    <div v-else class="flex flex-wrap gap-5 items-start">
      <!-- evaluatee list -->
      <div class="flex-1 basis-[280px] min-w-[260px] bg-white border border-gray-200 rounded-2xl p-3 flex flex-col gap-1">
        <button
          v-for="a in assignments" :key="a.id"
          class="flex items-center gap-2.5 text-left px-3 py-3 rounded-xl"
          :class="a.id === selectedId ? 'border border-[#1f4e8c] bg-[#e7eff9]' : 'hover:bg-gray-50'"
          @click="selectedId = a.id"
        >
          <div class="flex-none w-9 h-9 rounded-full bg-gray-100 text-ink-soft text-xs font-bold flex items-center justify-center">
            {{ a.evaluateeName.slice(0, 1) }}
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-semibold truncate">{{ a.evaluateeName }}</div>
            <div class="text-[11px] text-ink-soft truncate">{{ a.evaluateeDepartment || "-" }}</div>
          </div>
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full flex-none" :style="STATUS_STYLE[a.status]">{{ STATUS_LABEL[a.status] }}</span>
        </button>
        <div v-if="!assignments.length" class="text-sm text-ink-soft text-center py-6">ยังไม่มีผู้ได้รับมอบหมาย</div>
      </div>

      <!-- scoring detail -->
      <div v-if="selectedAssignment && scoreData" class="flex-[2] basis-[560px] min-w-0 flex flex-col gap-4">
        <div class="bg-white border border-gray-200 rounded-2xl p-5 flex items-center gap-3.5 flex-wrap">
          <div class="flex-none w-11 h-11 rounded-full bg-[#e7eff9] text-[#1f4e8c] text-sm font-bold flex items-center justify-center">
            {{ selectedAssignment.evaluateeName.slice(0, 1) }}
          </div>
          <div class="flex-1 min-w-[160px]">
            <div class="text-base font-bold">{{ selectedAssignment.evaluateeName }}</div>
            <div class="text-xs text-ink-soft">{{ selectedAssignment.evaluateeDepartment || "-" }} · ผู้รับการประเมิน</div>
          </div>
          <span class="text-xs font-semibold px-2.5 py-1 rounded-full" :style="STATUS_STYLE[selectedAssignment.status]">สถานะ: {{ STATUS_LABEL[selectedAssignment.status] }}</span>
        </div>

        <div class="bg-white border border-gray-200 rounded-2xl p-5">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-bold">ตัวชี้วัดและการให้คะแนน</h3>
            <span v-if="averageScore" class="text-sm font-bold" style="color:#1f4e8c">เฉลี่ย {{ averageScore }} / 4.0</span>
          </div>

          <div v-for="ind in scoreData.indicators" :key="ind.indicatorId" class="py-3 border-b border-gray-100 last:border-0">
            <div class="flex items-center gap-3.5 flex-wrap">
              <div class="flex-1 min-w-[160px]">
                <div class="text-sm font-semibold">{{ ind.name }}</div>
                <div class="text-xs text-ink-soft flex items-center gap-2">
                  น้ำหนัก {{ ind.weight }}%
                  <button type="button" class="font-semibold text-[#1f4e8c]" @click="toggleDetails(ind.indicatorId)">
                    {{ expandedIndicatorId === ind.indicatorId ? "ซ่อนหลักฐาน" : "ดูรายละเอียด/หลักฐาน" }}
                  </button>
                </div>
              </div>
              <div class="w-24 flex-none text-xs">
                <span v-if="ind.selfScore !== null" class="px-2 py-0.5 rounded-full bg-gray-100 text-ink-soft">ระดับ {{ ind.selfScore }}</span>
                <span v-else class="text-gray-400">ยังไม่กรอก</span>
              </div>
              <div class="flex gap-1.5 flex-none">
                <button
                  v-for="n in 4" :key="n" type="button"
                  :disabled="ind.selfScore === null || selectedAssignment.status === 'confirmed'"
                  class="w-8 h-8 rounded-lg border text-xs font-bold"
                  :class="[
                    Number(ind.scoreValue) === n ? 'border-[#1f4e8c] bg-[#1f4e8c] text-white' : 'border-gray-200 text-ink-soft',
                    (ind.selfScore === null || selectedAssignment.status === 'confirmed') ? 'opacity-40 cursor-not-allowed' : '',
                  ]"
                  @click="giveScore(ind.indicatorId, n)"
                >
                  {{ n }}
                </button>
              </div>
            </div>

            <div v-if="expandedIndicatorId === ind.indicatorId" class="mt-3 ml-0.5 flex flex-col gap-2 bg-brand-bg border border-gray-200 rounded-lg p-3.5">
              <div v-for="d in detailsCache[ind.indicatorId]" :key="d.id" class="text-xs">
                <div class="text-ink">{{ d.description }}</div>
                <div v-if="d.evidencePath" class="text-ink-soft mt-0.5">
                  หลักฐาน:
                  <a :href="useFileUrl(d.evidencePath)" target="_blank" rel="noopener" class="text-[#1f4e8c] underline">
                    {{ d.evidenceType === "url" ? d.evidencePath : d.evidencePath.split("/").pop() }}
                  </a>
                </div>
              </div>
              <div v-if="!detailsCache[ind.indicatorId]?.length" class="text-xs text-ink-soft">ผู้รับการประเมินยังไม่ได้กรอกรายละเอียด</div>
            </div>
          </div>
        </div>

        <div class="bg-white border border-gray-200 rounded-2xl p-5">
          <label class="text-sm font-bold block mb-2">ความคิดเห็นสรุปโดยภาพรวม</label>
          <textarea v-model="overallComment" rows="3" class="textarea textarea-bordered w-full" :disabled="selectedAssignment.status === 'confirmed'" @blur="saveComment"></textarea>
        </div>

        <div class="bg-white border border-gray-200 rounded-2xl p-5">
          <label class="text-sm font-bold block mb-2">ลงนามรับรองผลการประเมิน</label>
          <div v-if="selectedAssignment.status !== 'confirmed'" class="flex flex-col gap-3">
            <input type="file" accept=".jpg,.jpeg,.png,.pdf" class="file-input file-input-bordered file-input-sm w-full max-w-xs" @change="onSignatureChange" />
            <div class="flex justify-end gap-2">
              <button class="btn btn-sm" style="background:#b5792a;color:#fff;border:none;" :disabled="submitting" @click="submitFinal">
                <span v-if="submitting" class="loading loading-spinner loading-xs"></span>
                ยืนยันและส่งผลการประเมิน
              </button>
            </div>
          </div>
          <div v-else class="text-sm text-[#2f6bb0] font-semibold">ยืนยันและส่งผลการประเมินเรียบร้อยแล้ว</div>
        </div>
      </div>
    </div>
  </AppShell>
</template>
