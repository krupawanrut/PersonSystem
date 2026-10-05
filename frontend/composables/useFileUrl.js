// แปลง path ไฟล์ที่ backend คืนมา (เช่น /uploads/evidence/xxx.pdf) ให้เป็น URL เต็มที่ดาวน์โหลด/เปิดดูได้จริง
// ถ้าเป็น URL ภายนอกอยู่แล้ว (evidenceType = "url") คืนค่าเดิมโดยไม่แก้ไข
export function useFileUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//.test(path)) return path;
  const config = useRuntimeConfig();
  const fileBase = config.public.apiBase.replace(/\/api\/?$/, "");
  return fileBase + path;
}
