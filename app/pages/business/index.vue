<script setup lang="ts">
definePageMeta({ layout: "business", middleware: "business-auth", skipCmsLoader: true });
useSeoMeta({ title: "ბიზნესის მიმოხილვა — FlexDrive", robots: "noindex, nofollow" });
</script>

<template>
  <BusinessReport section="overview" />
</template>
