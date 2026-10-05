<script setup>
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/yup";
import * as yup from "yup";

const props = defineProps({
  role: { type: String, required: true }, // 'evaluatee' | 'evaluator'
  title: { type: String, required: true },
});

const api = useApi();
const users = ref([]);
const loading = ref(true);
const errorMessage = ref("");
const infoMessage = ref("");
const showForm = ref(false);

// ตรวจสอบข้อมูลฝั่ง client ก่อนส่ง (ข้อ 8.2) — ตรวจแบบ real-time ขณะกรอก ก่อนที่จะยิงไป backend อีกชั้น
const schema = toTypedSchema(
  yup.object({
    fullName: yup.string().trim().required("กรุณากรอกชื่อ-นามสกุล"),
    username: yup.string().trim().required("กรุณากรอกชื่อผู้ใช้งาน").min(3, "ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร"),
    password: yup.string().required("กรุณากรอกรหัสผ่านเริ่มต้น").min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร"),
    email: yup.string().trim().email("รูปแบบอีเมลไม่ถูกต้อง เช่น name@example.com").nullable().transform((v) => v || null),
    department: yup.string().trim().nullable(),
  })
);

const { handleSubmit, errors, defineField, resetForm } = useForm({
  validationSchema: schema,
  initialValues: { fullName: "", username: "", password: "", email: "", department: "" },
});

const [fullName, fullNameAttrs] = defineField("fullName");
const [username, usernameAttrs] = defineField("username");
const [password, passwordAttrs] = defineField("password");
const [email, emailAttrs] = defineField("email");
const [department, departmentAttrs] = defineField("department");

async function load() {
  loading.value = true;
  try {
    const { data } = await api.get("/users", { params: { role: props.role } });
    users.value = data.data;
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "โหลดข้อมูลไม่สำเร็จ";
  } finally {
    loading.value = false;
  }
}

const submit = handleSubmit(async (values) => {
  errorMessage.value = "";
  try {
    await api.post("/users", { ...values, role: props.role });
    resetForm();
    showForm.value = false;
    await load();
  } catch (err) {
    errorMessage.value = err.response?.data?.message || "เพิ่มผู้ใช้งานไม่สำเร็จ";
  }
});

async function removeUser(id) {
  if (!confirm("ยืนยันการลบผู้ใช้งานนี้?")) return;
  await api.delete(`/users/${id}`);
  await load();
}

async function resetPassword(id) {
  if (!confirm("ยืนยันการคืนค่ารหัสผ่านของผู้ใช้งานนี้?")) return;
  const { data } = await api.put(`/users/${id}/password-reset`);
  infoMessage.value = `คืนค่ารหัสผ่านสำเร็จ — รหัสผ่านชั่วคราว: ${data.data.temporaryPassword}`;
  await load();
}

onMounted(load);
</script>

<template>
  <div>
    <div class="flex items-center justify-between flex-wrap gap-3 mb-6">
      <div>
        <h1 class="text-xl font-bold text-ink mb-1">{{ title }}</h1>
        <p class="text-sm text-ink-soft">จัดการข้อมูลและรหัสผ่านของผู้ใช้งาน</p>
      </div>
      <button class="btn text-white border-none" style="background:#1f4e8c" @click="showForm = !showForm">+ เพิ่มผู้ใช้งาน</button>
    </div>

    <div v-if="errorMessage" class="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{{ errorMessage }}</div>
    <div v-if="infoMessage" class="text-sm text-[#1f4e8c] bg-[#e7eff9] border border-[#cddcf0] rounded-lg px-4 py-3 mb-4">{{ infoMessage }}</div>

    <form v-if="showForm" class="bg-white border border-gray-200 rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-1 mb-5" @submit.prevent="submit" novalidate>
      <div>
        <input v-model="fullName" v-bind="fullNameAttrs" placeholder="ชื่อ-นามสกุล" class="input input-bordered w-full" :class="{ 'input-error': errors.fullName }" />
        <p v-if="errors.fullName" class="text-xs text-red-600 mt-1">{{ errors.fullName }}</p>
      </div>
      <div>
        <input v-model="username" v-bind="usernameAttrs" placeholder="ชื่อผู้ใช้งาน (username)" class="input input-bordered w-full" :class="{ 'input-error': errors.username }" />
        <p v-if="errors.username" class="text-xs text-red-600 mt-1">{{ errors.username }}</p>
      </div>
      <div>
        <input v-model="password" v-bind="passwordAttrs" type="password" placeholder="รหัสผ่านเริ่มต้น" class="input input-bordered w-full" :class="{ 'input-error': errors.password }" />
        <p v-if="errors.password" class="text-xs text-red-600 mt-1">{{ errors.password }}</p>
      </div>
      <div>
        <input v-model="email" v-bind="emailAttrs" type="email" placeholder="อีเมล" class="input input-bordered w-full" :class="{ 'input-error': errors.email }" />
        <p v-if="errors.email" class="text-xs text-red-600 mt-1">{{ errors.email }}</p>
      </div>
      <div class="sm:col-span-2">
        <input v-model="department" v-bind="departmentAttrs" placeholder="แผนก/หน่วยงาน" class="input input-bordered w-full" />
      </div>
      <div class="sm:col-span-2 flex justify-end mt-2">
        <button type="submit" class="btn text-white border-none" style="background:#1f4e8c">บันทึก</button>
      </div>
    </form>

    <div class="bg-white border border-gray-200 rounded-2xl p-5">
      <div v-if="loading" class="text-sm text-ink-soft">กำลังโหลด...</div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-[11px] uppercase tracking-wide text-gray-400 border-b border-gray-200">
              <th class="pb-2 pr-3">ชื่อ-นามสกุล</th>
              <th class="pb-2 pr-3">ชื่อผู้ใช้งาน</th>
              <th class="pb-2 pr-3">แผนก</th>
              <th class="pb-2 pr-3">สถานะ</th>
              <th class="pb-2"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in users" :key="u.id" class="border-b border-gray-100 last:border-0">
              <td class="py-2.5 pr-3 font-medium">{{ u.fullName }}</td>
              <td class="py-2.5 pr-3 text-ink-soft">{{ u.username }}</td>
              <td class="py-2.5 pr-3 text-ink-soft">{{ u.department || "-" }}</td>
              <td class="py-2.5 pr-3">
                <span class="text-xs font-semibold px-2 py-0.5 rounded-full" :class="u.isActive ? 'bg-[#e7eff9] text-[#2f6bb0]' : 'bg-gray-100 text-gray-500'">
                  {{ u.isActive ? "ใช้งานอยู่" : "ปิดใช้งาน" }}
                </span>
              </td>
              <td class="py-2.5 flex gap-3">
                <button class="text-xs font-semibold text-[#1f4e8c]" @click="resetPassword(u.id)">รีเซ็ตรหัสผ่าน</button>
                <button class="text-xs font-semibold text-red-600" @click="removeUser(u.id)">ลบ</button>
              </td>
            </tr>
            <tr v-if="!users.length">
              <td colspan="5" class="py-6 text-center text-ink-soft">ยังไม่มีข้อมูล</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
