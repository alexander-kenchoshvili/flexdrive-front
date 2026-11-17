<script setup lang="ts">
import type { MarketingReport } from "~/utils/businessMarketing";
import { metaHasData, metaUpdated } from "~/utils/businessMarketing";
defineProps<{ report: MarketingReport }>();
const eventsUrl = "https://eventsmanager.facebook.com/events_manager2/list/dataset/1020718363721235/overview?business_id=1761419678356905";
</script>

<template>
  <section class="my-6 rounded-xl border border-border-default bg-surface p-4 md:p-6" aria-labelledby="meta-technical-title">
    <div class="flex flex-wrap items-center justify-between gap-3"><h2 id="meta-technical-title" class="text-lg font-bold">Meta · მოვლენების კავშირი</h2><a :href="eventsUrl" target="_blank" rel="noopener noreferrer" class="inline-flex min-h-[44px] items-center rounded-lg border border-border-default px-4 py-2 text-xs font-semibold underline underline-offset-4">Events Manager-ის გახსნა ↗</a></div>
    <p class="mt-2 text-xs leading-6 text-text-muted">აქ მოწმდება Pixel-ის კავშირი. რეკლამაზე მიწერილი გაყიდვები სხვა მაჩვენებელია; ყველა Purchase-ს არ უდრის.</p>
    <div class="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
      <article class="min-w-0 rounded-lg border border-border-default p-4"><h3 class="text-sm font-semibold">Pixel-ის წაკითხვა</h3>
        <template v-if="metaHasData(report.pixel)"><p class="mt-2 text-sm">{{ report.pixel?.name }} · {{ report.pixel?.id }}</p><p class="mt-2 text-xs leading-6">Meta-ს მიერ ნაჩვენები ბოლო მოვლენა: <strong>{{ report.pixel?.last_event_at ? metaUpdated(report.pixel.last_event_at) : 'დრო არ დაუბრუნებია' }}</strong></p><p class="mt-2 text-xs leading-6 text-text-muted">ეს დრო არ გვეუბნება, იყო თუ არა მოვლენა შეძენა ან ბრაუზერიდან მოვიდა თუ სერვერიდან.</p><p class="mt-2 text-xs text-text-muted">მიღებულია: {{ metaUpdated(report.pixel?.fetched_at) }} <strong v-if="report.pixel?.status === 'stale'" class="text-error">· ძველი პასუხი</strong></p><p v-if="report.pixel?.message" class="mt-2 text-xs text-text-muted">{{ report.pixel.message }}</p></template>
        <p v-else class="mt-2 text-sm leading-6 text-text-muted">{{ report.pixel?.message || 'Pixel-ის მიმდინარე პასუხი მიუწვდომელია. ეს მოვლენების არქონას არ ნიშნავს.' }}</p>
      </article>
      <article class="min-w-0 rounded-lg border border-border-default p-4"><h3 class="text-sm font-semibold">სერვერიდან გაგზავნა · CAPI</h3><p class="mt-2 text-sm">{{ report.technical?.capi_configured ? 'სერვერზე ჩართული და დაკონფიგურირებულია' : 'სერვერის პარამეტრები შესამოწმებელია' }}</p><p class="mt-2 text-xs leading-6 text-text-muted">პარამეტრების არსებობა კონკრეტული შეძენის მიღების მტკიცებულება არ არის.</p><p class="mt-2 text-xs leading-6 text-text-muted">{{ report.technical?.delivery_message || 'ბრაუზერისა და სერვერის მიღება და დუბლირების შედეგი ნახეთ Events Manager-ში.' }}</p></article>
    </div>
    <p class="mt-4 text-xs leading-6 text-text-muted">Events Manager-ში ნახავ, რომელი მოვლენები მიიღო Meta-მ და რომელი წყაროდან. სტატუსი მიმდინარეა და შერჩეული პერიოდის გაყიდვების ანგარიში არ არის. ამ ბმულის დამატება არაფერს ცვლის მომხმარებლის ყიდვის პროცესში.</p>
  </section>
</template>
