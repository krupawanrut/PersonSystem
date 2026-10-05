<script setup>
const { navItems } = useNav();
const api = useApi();
const topics = ref([]);
const evaluators = ref([]);
const evaluatees = ref([]);
const assignments = ref([]);
const errorMessage = ref("");

const form = reactive({ topicId: "", evaluatorId: "", evaluateeId: "", committeeRole: "member" });

async function loadAll() {
  const [t, ev, ee, as] = await Promise.all([
    api.get("/topics"),
    api.get("/users", { params: { role: "evaluator" } }),
    api.get("/users", { params: { role: "evaluatee" } }),
    api.get("/assignments"),
  ]);
  topics.value = t.data.data;
  evaluators.value = ev.data.data;
  evaluatees.value = ee.data.data;
  assignments.value = as.data.data;
}

async function submitAssignment() {
  errorMessage.value = "";
  try {
    await api.post("/assignments", form);
    await loadAll();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "มอบหมายกรรมการไม่สำเร็จ";
  }
}

async function removeAssignment(id) {
  if (!confirm("ยืนยันการยกเลิกการมอบหมายนี้?")) return;
  await api.delete(`/assignments/${id}`);
  await loadAll();
}

onMounted(loadAll);
</script>

<template>
  <AppShell :nav-items="navItems">
    <UserManager role="evaluator" title="กรรมการผู้ประเมิน" />

    <div class="mt-8">
      <h2 class="text-lg font-bold text-ink mb-4">มอบหมายกรรมการให้ประเมินผู้รับการประเมิน</h2>

      <div v-if="errorMessage" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{{ errorMessage }}</div>

      <form class="bg-white border border-gray-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5 items-end" @submit.prevent="submitAssignment">
        <div>
          <label class="text-xs font-semibold text-ink-soft block mb-1.5">หัวข้อการประเมิน</label>
          <select v-model="form.topicId" required class="select select-bordered w-full">
            <option disabled value="">เลือกหัวข้อ</option>
            <option v-for="t in topics" :key="t.id" :value="t.id">{{ t.name }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold text-ink-soft block mb-1.5">กรรมการผู้ประเมิน</label>
          <select v-model="form.evaluatorId" required class="select select-bordered w-full">
            <option disabled value="">เลือกกรรมการ</option>
            <option v-for="e in evaluators" :key="e.id" :value="e.id">{{ e.fullName }}</option>
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold text-ink-soft block mb-1.5">ผู้รับการประเมิน</label>
          <select v-model="form.evaluateeId" required class="select select-bordered w-full">
            <option disabled value="">เลือกผู้รับการประเมิน</option>
            <option v-for="e in evaluatees" :key="e.id" :value="e.id">{{ e.fullName }}</option>
          </select>
        </div>
        <div class="flex gap-2">
          <select v-model="form.committeeRole" class="select select-bordered w-full">
            <option value="chair">ประธานกรรมการ</option>
            <option value="member">กรรมการร่วม</option>
          </select>
          <button type="submit" class="btn text-white border-none flex-none" style="background:#1f4e8c">มอบหมาย</button>
        </div>
      </form>

      <div class="bg-white border border-gray-200 rounded-2xl p-5">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200">
                <th class="pb-2 pr-3">กรรมการ</th>
                <th class="pb-2 pr-3">ผู้รับการประเมิน</th>
                <th class="pb-2 pr-3">บทบาท</th>
                <th class="pb-2 pr-3">สถานะ</th>
                <th class="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="a in assignments" :key="a.id" class="border-b border-gray-100 last:border-0">
                <td class="py-2.5 pr-3 font-medium">{{ a.evaluatorName }}</td>
                <td class="py-2.5 pr-3">{{ a.evaluateeName }}</td>
                <td class="py-2.5 pr-3 text-ink-soft">{{ a.committeeRole === "chair" ? "ประธานกรรมการ" : "กรรมการร่วม" }}</td>
                <td class="py-2.5 pr-3 text-ink-soft">{{ { not_started: "ยังไม่ประเมิน", draft: "ร่าง", confirmed: "ยืนยันแล้ว" }[a.status] }}</td>
                <td class="py-2.5"><button class="text-xs font-semibold text-red-600" @click="removeAssignment(a.id)">ยกเลิก</button></td>
              </tr>
              <tr v-if="!assignments.length">
                <td colspan="5" class="py-6 text-center text-ink-soft">ยังไม่มีการมอบหมาย</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppShell>
</template>
