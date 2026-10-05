<script setup>
const navItems = [
  { label: "แดชบอร์ด", to: "/dashboard", icon: "grid" },
  { label: "หัวข้อการประเมิน", to: "/hr/topics", icon: "doc" },
  { label: "ผู้รับการประเมิน", to: "/hr/evaluatees", icon: "people" },
  { label: "กรรมการผู้ประเมิน", to: "/hr/evaluators", icon: "judge" },
  { label: "รายงาน", to: "/hr/reports", icon: "bars" },
];
</script>

<template>
  <AppShell :nav-items="navItems">
    <UserManager role="evaluatee" title="ผู้รับการประเมิน" />
  </AppShell>
</template>
