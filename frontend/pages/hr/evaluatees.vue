<script setup>
const { navItems } = useNav();
</script>

<template>
  <AppShell :nav-items="navItems">
    <UserManager role="evaluatee" title="ผู้รับการประเมิน" />
  </AppShell>
</template>
