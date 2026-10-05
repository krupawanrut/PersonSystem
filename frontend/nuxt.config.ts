export default defineNuxtConfig({
  compatibilityDate: "2026-01-01",
  devtools: { enabled: true },
  // แอปนี้พึ่งพา JWT ใน localStorage ล้วน ๆ (ไม่ใช้ cookie/session ฝั่งเซิร์ฟเวอร์)
  // จึงปิด SSR เพื่อให้ตรรกะตรวจสอบสิทธิ์ทำงานฝั่ง client อย่างสม่ำเสมอ ไม่มี hydration mismatch
  ssr: false,

  modules: ["@nuxtjs/tailwindcss", "@pinia/nuxt"],

  css: ["~/assets/css/main.css"],

  app: {
    head: {
      title: "ระบบประเมินบุคลากร",
      htmlAttrs: { lang: "th" },
      link: [
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap",
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || "http://localhost:4000/api",
    },
  },
});
