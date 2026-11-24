<template>
  <BusinessPeriodPage title="Google · საძიებო სისტემა" source="Google Search Console" description="როგორ ჩნდება ჩვენი საიტი Google-ის ძიებაში. საიტის შიდა ძიება GA4-ის განყოფილებაშია."><template #default="{ period, refreshKey }"><BusinessSearchConsole :key="refreshKey" :period="period" /></template></BusinessPeriodPage>
</template>
