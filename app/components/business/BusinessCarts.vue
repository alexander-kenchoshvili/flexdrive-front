<script setup lang="ts">
const route = useRoute();
const tabs = [{ key: "contents", label: "ახლა კალათებში" }, { key: "additions", label: "დამატებები პერიოდში" }, { key: "products", label: "პროდუქტების ინტერესი" }, { key: "checkout", label: "დაწყებული ყიდვები" }];
const selected = computed(() => tabs.some((tab) => tab.key === route.query.tab) ? String(route.query.tab) : "contents");
</script>
<template>
  <BusinessTabs :tabs="tabs" :selected="selected" />
  <BusinessCheckout v-if="selected === 'checkout'" />
  <BusinessPeriodPage v-else title="კალათები და პროდუქტების ინტერესი" source="FlexDrive-ის ბაზა" description="მიმდინარე შიგთავსი და პერიოდში დამატებები განსხვავებული ანგარიშებია. კალათების რაოდენობა ადამიანების რაოდენობას არ ნიშნავს."><template #default="{ period, refreshKey }"><BusinessCartReport :key="`${selected}:${refreshKey}`" :period="period" :mode="selected" /></template></BusinessPeriodPage>
</template>
