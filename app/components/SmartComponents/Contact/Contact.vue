<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import {
  ArrowRightIcon,
  ClockIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
} from "@heroicons/vue/24/outline";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
import type { Component } from "vue";
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import BaseRichText from "~/components/common/BaseRichText.vue";
import { sanitizeText } from "~/composables/helpers";
import type {
  ContactExpectation,
  ContactNotice,
  ContactReason,
  ContactShortcut,
  ContactTopic,
} from "~/types/contact";
import type { ContentItemData, SmartComponentRenderData } from "~/types/page";

type ContactData = SmartComponentRenderData & {
  updated_at?: string | null;
};

type SupportRow = {
  key: string;
  label: string;
  value: string;
  href?: string;
  icon: Component;
};

const props = defineProps<{
  data?: ContactData;
}>();

const footerStore = useFooter();
const { executeRecaptcha } = useRecaptcha();
const { submitContactInquiry } = useContactApi();
const { contactInquirySchema } = useContactValidationSchemas();

const sectionTitle = computed(
  () => sanitizeText(props.data?.title) || "დაგვიკავშირდით",
);

const rawItems = computed<ContentItemData[]>(() => {
  const list = props.data?.contentData?.list;
  return Array.isArray(list) ? list : [];
});

const routePathFromSlug = (slug: string) => {
  const normalizedSlug = slug.trim().replace(/^\/+|\/+$/g, "");
  if (!normalizedSlug || normalizedSlug === "main") return "/";
  return `/${normalizedSlug}`;
};

const topics = computed<ContactTopic[]>(() =>
  rawItems.value
    .filter((item) => item.content_type === "contact_topic")
    .map((item, index) => ({
      id: Number(item.id ?? index + 1),
      slug: sanitizeText(item.slug),
      label: sanitizeText(item.title),
      position: Number(item.position ?? index + 1),
    }))
    .filter((item) => item.slug && item.label)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    ),
);

const shortcuts = computed<ContactShortcut[]>(() =>
  rawItems.value
    .filter((item) => item.content_type === "contact_shortcut")
    .map((item, index) => {
      const slug = sanitizeText(item.slug);

      return {
        id: Number(item.id ?? index + 1),
        slug,
        title: sanitizeText(item.title),
        description: sanitizeText(item.description),
        iconSvg: sanitizeText(item.icon_svg),
        position: Number(item.position ?? index + 1),
        routePath: routePathFromSlug(slug),
      };
    })
    .filter((item) => item.slug && (item.title || item.description))
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    ),
);

const noticesBySlug = computed<Record<string, ContactNotice>>(() =>
  rawItems.value
    .filter((item) => item.content_type === "contact_notice")
    .map((item, index) => ({
      id: Number(item.id ?? index + 1),
      slug: sanitizeText(item.slug),
      title: sanitizeText(item.title),
      description: sanitizeText(item.description),
      html: item.editor?.trim() || "",
      position: Number(item.position ?? index + 1),
    }))
    .filter((item) => item.slug)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    )
    .reduce<Record<string, ContactNotice>>((accumulator, item) => {
      accumulator[item.slug] = item;
      return accumulator;
    }, {}),
);

const expectations = computed<ContactExpectation[]>(() =>
  rawItems.value
    .filter((item) => item.content_type === "contact_expectation")
    .map((item, index) => ({
      id: Number(item.id ?? index + 1),
      title: sanitizeText(item.title),
      description: sanitizeText(item.description),
      position: Number(item.position ?? index + 1),
    }))
    .filter((item) => item.title || item.description)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    ),
);

const reasons = computed<ContactReason[]>(() =>
  rawItems.value
    .filter((item) => item.content_type === "contact_reason")
    .map((item, index) => ({
      id: Number(item.id ?? index + 1),
      title: sanitizeText(item.title),
      description: sanitizeText(item.description),
      position: Number(item.position ?? index + 1),
    }))
    .filter((item) => item.title || item.description)
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    ),
);

const topicOptions = computed(() =>
  topics.value.map((topic) => ({
    label: topic.label,
    value: topic.slug,
  })),
);

const footerContact = computed(() => footerStore.footer?.contact ?? null);
const footerSocials = computed(() =>
  (footerStore.footer?.socials ?? []).filter((item) => item.type !== "email"),
);

const normalizedPhoneLink = (phone: string) =>
  `tel:${phone.replace(/\s+/g, "")}`;
const normalizedEmailLink = (email: string) => `mailto:${email}`;

const supportRows = computed<SupportRow[]>(() => {
  const contact = footerContact.value;
  if (!contact) return [];

  return [
    contact.phone
      ? {
          key: "phone",
          label: "ტელეფონი",
          value: contact.phone,
          href: normalizedPhoneLink(contact.phone),
          icon: PhoneIcon,
        }
      : null,
    contact.email
      ? {
          key: "email",
          label: "ელფოსტა",
          value: contact.email,
          href: normalizedEmailLink(contact.email),
          icon: EnvelopeIcon,
        }
      : null,
    contact.working_hours
      ? {
          key: "working-hours",
          label: "სამუშაო საათები",
          value: contact.working_hours,
          icon: ClockIcon,
        }
      : null,
    contact.city
      ? {
          key: "city",
          label: "ქალაქი",
          value: contact.city,
          icon: MapPinIcon,
        }
      : null,
  ].filter(Boolean) as SupportRow[];
});

const supportIntroNotice = computed(
  () => noticesBySlug.value.support_intro ?? null,
);
const responseNoteNotice = computed(
  () => noticesBySlug.value.response_note ?? null,
);
const shortcutsIntroNotice = computed(
  () => noticesBySlug.value.shortcuts_intro ?? null,
);
const expectationsIntroNotice = computed(
  () => noticesBySlug.value.expectations_intro ?? null,
);
const reasonsIntroNotice = computed(
  () => noticesBySlug.value.reasons_intro ?? null,
);

const breadcrumbItems = computed(() => [
  { label: "მთავარი", to: "/" },
  { label: sectionTitle.value },
]);

const isSuccessModalOpen = ref(false);
const successModalMessage = ref("");
const errorMessage = ref("");
const loading = ref(false);

const initialFormValues = {
  full_name: "",
  phone: "",
  email: "",
  topic_slug: "",
  order_number: "",
  message: "",
};

const contactFieldOrder = [
  "full_name",
  "phone",
  "email",
  "topic_slug",
  "order_number",
  "message",
] as const;

type ContactFieldName = (typeof contactFieldOrder)[number];

const { defineField, errors, handleSubmit, resetForm, setFieldError } = useForm(
  {
    validationSchema: toTypedSchema(contactInquirySchema),
    initialValues: initialFormValues,
  },
);

const [fullName, fullNameAttrs] = defineField("full_name");
const [phone, phoneAttrs] = defineField("phone");
const [email, emailAttrs] = defineField("email");
const [topicSlug, topicSlugAttrs] = defineField("topic_slug");
const [orderNumber, orderNumberAttrs] = defineField("order_number");
const [message, messageAttrs] = defineField("message");

const scrollToField = async (fieldName: ContactFieldName) => {
  await nextTick();

  const field = document.querySelector<HTMLElement>(`[name="${fieldName}"]`);
  if (!field) return;

  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const top = Math.max(
    field.getBoundingClientRect().top + window.scrollY - 180,
    0,
  );

  window.scrollTo({
    top,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  });

  requestAnimationFrame(() => {
    field.focus({ preventScroll: true });
  });
};

const scrollToFirstInvalidField = async (
  fieldState: Partial<Record<ContactFieldName, unknown>>,
) => {
  const firstField = contactFieldOrder.find((fieldName) => {
    const fieldValue = fieldState[fieldName];

    if (Array.isArray(fieldValue)) {
      return fieldValue.length > 0;
    }

    return Boolean(fieldValue);
  });

  if (firstField) {
    await scrollToField(firstField);
  }
};

const closeSuccessModal = () => {
  isSuccessModalOpen.value = false;
  successModalMessage.value = "";
};

const submitContactForm = handleSubmit(
  async (values) => {
    loading.value = true;
    successModalMessage.value = "";
    isSuccessModalOpen.value = false;
    errorMessage.value = "";

    try {
      const recaptchaToken = await executeRecaptcha("contact_inquiry");
      const response = await submitContactInquiry({
        ...values,
        order_number: values.order_number?.trim() || undefined,
        recaptcha_token: recaptchaToken,
      });

      successModalMessage.value =
        response.message ||
        "შეტყობინება წარმატებით გაიგზავნა. სამუშაო საათებში მაქსიმალურად სწრაფად დაგიბრუნდებით პასუხს.";

      resetForm({
        values: initialFormValues,
      });
      isSuccessModalOpen.value = true;
    } catch (error: any) {
      const payload = error?.data ?? {};

      contactFieldOrder.forEach((fieldName) => {
        const fieldErrors = payload?.[fieldName];

        if (Array.isArray(fieldErrors) && fieldErrors.length) {
          setFieldError(fieldName, String(fieldErrors[0]));
        }
      });

      errorMessage.value =
        payload?.detail ||
        payload?.message ||
        "შეტყობინების გაგზავნა ვერ მოხერხდა. სცადეთ თავიდან ან დაგვიკავშირდით ტელეფონით.";

      await scrollToFirstInvalidField(payload);
    } finally {
      loading.value = false;
    }
  },
  async ({ errors: invalidErrors }) => {
    await scrollToFirstInvalidField(
      invalidErrors as Partial<Record<ContactFieldName, unknown>>,
    );
  },
);
</script>

<template>
  <section class="relative overflow-hidden py-8 md:py-10 lg:py-12">
    <div
      class="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(circle_at_top,rgba(255,107,53,0.18),transparent_58%),linear-gradient(180deg,var(--section-warm)_0%,transparent_100%)]"
      aria-hidden="true"
    />

    <div class="container-fluid relative">
      <AppBreadcrumbs :items="breadcrumbItems" />

      <div
        class="mt-6 rounded-[30px] border border-border-default bg-surface shadow-[0_26px_64px_-42px_var(--shadow-color)]"
      >
        <div class="px-5 py-6 md:px-8 md:py-8 lg:px-10">
          <div
            v-if="shortcuts.length"
            class="rounded-[30px] border border-border-default bg-surface-2/60 p-5 md:p-6"
          >
            <div class="grid gap-3">
              <div>
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary"
                >
                  სწრაფი გზამკვლევი
                </p>
                <h2 class="title-under-xs mt-2 text-2xl font-extrabold text-text-primary">
                  {{
                    shortcutsIntroNotice?.title ||
                    "სანამ მოგვწერთ, ჯერ აქაც გადაახედეთ"
                  }}
                </h2>
              </div>
              <p class="subtitle-under-xs text-sm leading-7 text-text-secondary">
                {{
                  shortcutsIntroNotice?.description ||
                  "ხშირი პროცესების დეტალები უკვე გამოყოფილია ცალკე გვერდებზე, რათა საჭირო პასუხი სწრაფად იპოვოთ."
                }}
              </p>
            </div>

            <div
              class="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4"
            >
              <NuxtLink
                v-for="shortcut in shortcuts"
                :key="shortcut.id"
                :to="shortcut.routePath"
                class="group rounded-[24px] will-change-transform border border-border-default bg-surface p-5 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-accent-primary/35 hover:shadow-[0_18px_32px_-24px_var(--shadow-color)]"
              >
                <div class="flex items-start justify-between gap-3">
                  <span
                    class="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-accent-primary"
                    aria-hidden="true"
                    v-html="shortcut.iconSvg"
                  />
                  <ArrowRightIcon
                    class="h-5 w-5 text-accent-primary transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                    aria-hidden="true"
                  />
                </div>

                <h3 class="mt-5 text-lg font-bold leading-7 text-text-primary">
                  {{ shortcut.title }}
                </h3>
                <p class="mt-3 text-sm leading-7 text-text-secondary">
                  {{ shortcut.description }}
                </p>
              </NuxtLink>
            </div>
          </div>

          <div
            class="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_360px] xl:gap-8"
          >
            <div
              class="rounded-[30px] border border-border-default bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-2)_100%)] p-5 shadow-[0_22px_52px_-38px_var(--shadow-color)] md:p-7"
            >
              <div class="grid gap-3">
                <div>
                  <p
                    class="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary"
                  >
                    ფორმა
                  </p>
                  <h2 class="title-under-xs mt-2 text-2xl font-extrabold text-text-primary">
                    შეტყობინების გაგზავნა
                  </h2>
                </div>

                <p class="subtitle-under-xs text-sm leading-7 text-text-secondary">
                  რაც უფრო ზუსტად აღწერთ საკითხს, მით უფრო სწრაფად და სწორად
                  მოგცემთ პასუხს ჩვენი გუნდი.
                </p>
              </div>

              <form
                class="mt-6 grid gap-4 md:grid-cols-2"
                novalidate
                @submit.prevent="submitContactForm"
              >
                <BaseInput
                  v-model="fullName"
                  v-bind="fullNameAttrs"
                  label="სახელი და გვარი"
                  name="full_name"
                  autocomplete="name"
                  placeholder="მაგ: ანა ბერიძე"
                  :error="errors.full_name"
                  :disabled="loading"
                />

                <BaseInput
                  v-model="phone"
                  v-bind="phoneAttrs"
                  label="ტელეფონი"
                  name="phone"
                  autocomplete="tel"
                  placeholder="+995 5XX XX XX XX"
                  :error="errors.phone"
                  :disabled="loading"
                />

                <BaseInput
                  v-model="email"
                  v-bind="emailAttrs"
                  class="md:col-span-2"
                  label="ელფოსტა"
                  type="email"
                  name="email"
                  autocomplete="email"
                  placeholder="you@example.com"
                  :error="errors.email"
                  :disabled="loading"
                />

                <BaseSelect
                  v-model="topicSlug"
                  v-bind="topicSlugAttrs"
                  label="საკითხის თემა"
                  name="topic_slug"
                  class="md:col-span-2"
                  placeholder="აირჩიეთ თემა"
                  :options="topicOptions"
                  :error="errors.topic_slug"
                  :disabled="loading || !topicOptions.length"
                />

                <BaseInput
                  v-model="orderNumber"
                  v-bind="orderNumberAttrs"
                  class="md:col-span-2"
                  label="შეკვეთის ნომერი (არასავალდებულო)"
                  name="order_number"
                  autocomplete="off"
                  placeholder="მაგ: AM-1024"
                  :error="errors.order_number"
                  :disabled="loading"
                />

                <BaseTextarea
                  v-model="message"
                  v-bind="messageAttrs"
                  class="md:col-span-2"
                  label="შეტყობინება"
                  name="message"
                  placeholder="მოკლედ აღწერეთ რაში გჭირდებათ დახმარება."
                  :rows="6"
                  :error="errors.message"
                  :disabled="loading"
                />

                <div class="md:col-span-2">
                  <div
                    v-if="errorMessage"
                    class="mb-4 rounded-[20px] border border-error/20 bg-error/10 px-4 py-3 text-sm text-error"
                  >
                    {{ errorMessage }}
                  </div>

                  <div class="flex flex-col items-start gap-10">
                    <p class="text-sm leading-7 text-text-secondary">
                      {{
                        responseNoteNotice?.description ||
                        "სამუშაო საათებში შეტყობინებებს მაქსიმალურად სწრაფად ვამუშავებთ. არასამუშაო დროს დაგიკავშირდებით მომდევნო სამუშაო დღეს."
                      }}
                    </p>

                    <BaseButton
                      class="self-center"
                      type="submit"
                      size="lg"
                      :loading="loading"
                      :disabled="loading"
                    >
                      შეტყობინების გაგზავნა
                    </BaseButton>
                  </div>
                </div>
              </form>
            </div>

            <div class="space-y-5">
              <div
                class="rounded-[28px] border border-border-default bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-2)_100%)] p-5 shadow-[0_22px_48px_-38px_var(--shadow-color)]"
              >
                <p
                  class="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary"
                >
                  დახმარება
                </p>
                <h2 class="title-under-xs mt-3 text-xl font-extrabold text-text-primary">
                  {{ supportIntroNotice?.title || "სწრაფი კონტაქტი" }}
                </h2>
                <p class="subtitle-under-xs mt-3 text-sm leading-7 text-text-secondary">
                  {{
                    supportIntroNotice?.description ||
                    "თუ გსურთ მოკლე შეკითხვის სწრაფად გარკვევა, გამოიყენეთ ქვემოთ მოცემული პირდაპირი არხები."
                  }}
                </p>

                <div class="mt-5 space-y-3">
                  <div
                    v-for="row in supportRows"
                    :key="`support-${row.key}`"
                    class="rounded-[20px] border border-border-default bg-surface px-4 py-3"
                  >
                    <div class="flex items-start gap-3">
                      <span
                        class="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent-primary"
                      >
                        <component
                          :is="row.icon"
                          class="h-5 w-5"
                          aria-hidden="true"
                        />
                      </span>
                      <div class="min-w-0">
                        <p
                          class="text-xs font-semibold uppercase tracking-[0.14em] text-text-muted"
                        >
                          {{ row.label }}
                        </p>
                        <a
                          v-if="row.href"
                          :href="row.href"
                          class="mt-1 block break-words text-sm font-semibold text-text-primary transition-colors duration-200 hover:text-accent-primary"
                        >
                          {{ row.value }}
                        </a>
                        <p
                          v-else
                          class="mt-1 break-words text-sm font-semibold text-text-primary"
                        >
                          {{ row.value }}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  v-if="footerSocials.length"
                  class="mt-5 flex flex-wrap gap-2"
                >
                  <a
                    v-for="social in footerSocials"
                    :key="`${social.type}-${social.url}`"
                    :href="social.url"
                    target="_blank"
                    rel="noreferrer"
                    class="rounded-full border border-border-default bg-surface px-3 py-2 text-xs font-semibold text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary"
                  >
                    {{ social.label }}
                  </a>
                </div>
              </div>

              <div
                v-if="responseNoteNotice?.title || responseNoteNotice?.html"
                class="rounded-[28px] border border-border-default bg-surface p-5 shadow-[0_18px_42px_-34px_var(--shadow-color)]"
              >
                <h2
                  v-if="responseNoteNotice?.title"
                  class="title-under-xs text-xl font-extrabold text-text-primary"
                >
                  {{ responseNoteNotice.title }}
                </h2>

                <BaseRichText
                  v-if="responseNoteNotice?.html"
                  class="mt-4"
                  :html="responseNoteNotice.html"
                />
              </div>
            </div>
          </div>

          <div
            v-if="expectations.length || reasons.length"
            class="mt-8 grid gap-6 lg:grid-cols-2 xl:gap-8"
          >
            <div
              v-if="expectations.length"
              class="rounded-[30px] border border-border-default bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-2)_100%)] p-5 shadow-[0_22px_48px_-38px_var(--shadow-color)] md:p-6"
            >
              <p
                class="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary"
              >
                პროცესი
              </p>
              <h2 class="title-under-xs mt-2 text-2xl font-extrabold text-text-primary">
                {{
                  expectationsIntroNotice?.title || "რას უნდა ელოდოთ პასუხისგან"
                }}
              </h2>
              <p class="subtitle-under-xs mt-3 text-sm leading-7 text-text-secondary">
                {{
                  expectationsIntroNotice?.description ||
                  "თითოეული მოთხოვნა ჯერ კონტექსტის მიხედვით მოწმდება, შემდეგ კი სწორი პროცესით ან პასუხისმგებელ არხზე გადადის."
                }}
              </p>

              <div class="mt-6 space-y-4">
                <div
                  v-for="(expectation, index) in expectations"
                  :key="expectation.id"
                  class="rounded-[22px] border border-border-default bg-surface px-4 py-4"
                >
                  <div class="flex items-start gap-4">
                    <span
                      class="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border-default bg-surface-2 text-sm font-bold text-accent-primary"
                    >
                      {{ String(index + 1).padStart(2, "0") }}
                    </span>
                    <div>
                      <h3 class="text-base font-bold text-text-primary">
                        {{ expectation.title }}
                      </h3>
                      <p class="mt-2 text-sm leading-7 text-text-secondary">
                        {{ expectation.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              v-if="reasons.length"
              class="rounded-[30px] border border-border-default bg-[linear-gradient(180deg,var(--surface)_0%,var(--surface-2)_100%)] p-5 shadow-[0_22px_48px_-38px_var(--shadow-color)] md:p-6"
            >
              <p
                class="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary"
              >
                რატომ გვწერენ
              </p>
              <h2 class="title-under-xs mt-2 text-2xl font-extrabold text-text-primary">
                {{ reasonsIntroNotice?.title || "რით შეგვიძლია დაგეხმაროთ" }}
              </h2>
              <p class="subtitle-under-xs mt-3 text-sm leading-7 text-text-secondary">
                {{
                  reasonsIntroNotice?.description ||
                  "კონტაქტის გვერდი განსაკუთრებით გამოგადგებათ მაშინ, როცა გჭირდებათ შეკვეთის, პროდუქტის ან პროცესის დაზუსტება."
                }}
              </p>

              <div class="mt-6 space-y-4">
                <div
                  v-for="reason in reasons"
                  :key="reason.id"
                  class="rounded-[22px] border border-border-default bg-surface px-4 py-4"
                >
                  <div class="flex items-start gap-3">
                    <CheckCircleIcon
                      class="mt-0.5 h-6 w-6 shrink-0 text-accent-primary"
                      aria-hidden="true"
                    />
                    <div>
                      <h3 class="text-base font-bold text-text-primary">
                        {{ reason.title }}
                      </h3>
                      <p class="mt-2 text-sm leading-7 text-text-secondary">
                        {{ reason.description }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <BaseModal
    :show="isSuccessModalOpen"
    title="შეტყობინება წარმატებით გაიგზავნა"
    @close="closeSuccessModal"
  >
    <div class="flex flex-col items-center text-center">
      <div
        class="grid h-16 w-16 place-items-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary"
      >
        <CheckCircleIcon class="h-8 w-8" aria-hidden="true" />
      </div>

      <p class="mt-5 max-w-md text-sm leading-7 text-text-secondary md:text-base">
        {{
          successModalMessage ||
          "თქვენი შეტყობინება მიღებულია. სამუშაო საათებში მაქსიმალურად სწრაფად დაგიბრუნდებით პასუხს, არასამუშაო დროს კი მომდევნო სამუშაო დღეს."
        }}
      </p>
    </div>

    <template #footer>
      <BaseButton
        type="button"
        size="lg"
        :full-width="true"
        @click="closeSuccessModal"
      >
        გასაგებია
      </BaseButton>
    </template>
  </BaseModal>
</template>
