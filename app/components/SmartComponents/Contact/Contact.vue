<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import {
  ArrowRightIcon,
  ClockIcon,
  CreditCardIcon,
  EnvelopeIcon,
  MapPinIcon,
  PhoneIcon,
  ReceiptRefundIcon,
  Squares2X2Icon,
  TruckIcon,
} from "@heroicons/vue/24/outline";
import { CheckCircleIcon } from "@heroicons/vue/24/solid";
import type { Component } from "vue";
import AppBreadcrumbs from "~/components/common/AppBreadcrumbs.vue";
import { sanitizeText } from "~/composables/helpers";
import type {
  ContactNotice,
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
const sectionSubtitle = computed(() =>
  sanitizeText(props.data?.subtitle),
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
        position: Number(item.position ?? index + 1),
        routePath: routePathFromSlug(slug),
      };
    })
    .filter((item) => item.slug && (item.title || item.description))
    .sort((a, b) =>
      a.position === b.position ? a.id - b.id : a.position - b.position,
    ),
);

const shortcutIconMap: Record<string, Component> = {
  catalog: Squares2X2Icon,
  delivery: TruckIcon,
  "payment-methods": CreditCardIcon,
  returns: ReceiptRefundIcon,
};

const getShortcutIcon = (slug: string) => shortcutIconMap[slug] || ArrowRightIcon;

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

const breadcrumbItems = computed(() => [
  { label: "მთავარი", to: "/" },
  { label: "კონტაქტი" },
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
  <section class="py-6 sm:py-8 lg:py-10">
    <div class="container-fluid">
      <AppBreadcrumbs :items="breadcrumbItems" />

      <header class="mt-5 max-w-3xl sm:mt-6">
        <h1
          class="upper text-3xl font-extrabold leading-tight text-text-primary sm:text-4xl lg:text-5xl"
        >
          {{ sectionTitle }}
        </h1>
        <p
          v-if="sectionSubtitle"
          class="mt-3 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base sm:leading-8"
        >
          {{ sectionSubtitle }}
        </p>
      </header>

      <div
        class="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] xl:gap-6"
      >
        <div
          class="rounded-[22px] border border-border-default bg-surface p-4 shadow-[0_22px_52px_-40px_var(--shadow-color)] sm:rounded-[26px] sm:p-6 lg:p-7"
        >
          <div class="max-w-2xl">
            <h2 class="text-xl font-extrabold text-text-primary sm:text-2xl">
              შეტყობინების გაგზავნა
            </h2>
            <p class="mt-2 text-sm leading-7 text-text-secondary">
              მიუთითეთ საკონტაქტო ინფორმაცია და მოკლედ აღწერეთ საკითხი.
              შეკვეთის შემთხვევაში დაამატეთ შეკვეთის ნომერიც.
            </p>
          </div>

          <form
            class="mt-5 grid gap-3.5 sm:gap-4 md:grid-cols-2"
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
              placeholder="მაგ: ORD-20260515-000001"
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
              :rows="5"
              :error="errors.message"
              :disabled="loading"
            />

            <div class="md:col-span-2">
              <div
                v-if="errorMessage"
                class="mb-4 rounded-lg border border-error/20 bg-error/10 px-4 py-3 text-sm text-error"
              >
                {{ errorMessage }}
              </div>

              <div
                class="flex flex-col gap-4 border-t border-border-default pt-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <p class="text-xs leading-6 text-text-muted sm:max-w-md">
                  {{
                    responseNoteNotice?.description ||
                    "სამუშაო საათებში შეტყობინებებს მაქსიმალურად სწრაფად ვამუშავებთ."
                  }}
                </p>

                <BaseButton
                  class="w-full sm:w-auto"
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

        <aside class="space-y-4">
          <div
            class="rounded-[22px] border border-border-default bg-surface p-4 shadow-[0_18px_44px_-38px_var(--shadow-color)] sm:rounded-[26px] sm:p-5"
          >
            <h2 class="text-lg font-extrabold text-text-primary">
              {{ supportIntroNotice?.title || "სწრაფი კონტაქტი" }}
            </h2>
            <p
              v-if="supportIntroNotice?.description"
              class="mt-2 text-sm leading-7 text-text-secondary"
            >
              {{ supportIntroNotice.description }}
            </p>

            <div class="mt-4 divide-y divide-border-default">
              <div
                v-for="row in supportRows"
                :key="`support-${row.key}`"
                class="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span
                  class="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-border-default bg-surface-2 text-accent-primary"
                >
                  <component :is="row.icon" class="h-5 w-5" aria-hidden="true" />
                </span>
                <div class="min-w-0">
                  <p class="text-xs font-semibold text-text-muted">
                    {{ row.label }}
                  </p>
                  <a
                    v-if="row.href"
                    :href="row.href"
                    class="mt-1 block break-words text-sm font-bold text-text-primary transition-colors duration-200 hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
                  >
                    {{ row.value }}
                  </a>
                  <p v-else class="mt-1 break-words text-sm font-bold text-text-primary">
                    {{ row.value }}
                  </p>
                </div>
              </div>
            </div>

            <div v-if="footerSocials.length" class="mt-5 flex flex-wrap gap-2">
              <a
                v-for="social in footerSocials"
                :key="`${social.type}-${social.url}`"
                :href="social.url"
                target="_blank"
                rel="noreferrer"
                class="rounded-lg border border-border-default bg-surface-2 px-3 py-2 text-xs font-semibold text-text-secondary transition-colors duration-200 hover:border-accent-primary hover:text-accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
              >
                {{ social.label }}
              </a>
            </div>
          </div>
        </aside>
      </div>

      <section
        v-if="shortcuts.length"
        class="mt-4 rounded-[22px] border border-border-default bg-surface-2/70 p-4 sm:mt-5 sm:rounded-[26px] sm:p-5 lg:mt-6"
        aria-labelledby="contact-shortcuts-heading"
      >
        <div class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="contact-shortcuts-heading"
              class="text-lg font-extrabold text-text-primary sm:text-xl"
            >
              {{ shortcutsIntroNotice?.title || "სწრაფი ბმულები" }}
            </h2>
            <p class="mt-1 text-sm leading-6 text-text-secondary">
              {{
                shortcutsIntroNotice?.description ||
                "ხშირი პროცესების დეტალები ცალკე გვერდებზეა დალაგებული."
              }}
            </p>
          </div>
        </div>

        <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <NuxtLink
            v-for="shortcut in shortcuts"
            :key="shortcut.id"
            :to="shortcut.routePath"
            class="group flex min-h-[120px] flex-col justify-between rounded-lg border border-border-default bg-surface p-4 transition-[border-color,box-shadow] duration-200 hover:border-accent-primary hover:shadow-[0_16px_28px_-24px_var(--shadow-color)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary"
          >
            <div class="flex items-start justify-between gap-3">
              <span
                class="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-accent-primary"
                aria-hidden="true"
              >
                <component :is="getShortcutIcon(shortcut.slug)" class="h-5 w-5" />
              </span>
              <ArrowRightIcon
                class="h-5 w-5 text-text-muted transition-colors duration-200 group-hover:text-accent-primary"
                aria-hidden="true"
              />
            </div>

            <div class="mt-4">
              <h3 class="text-base font-bold text-text-primary">
                {{ shortcut.title }}
              </h3>
              <p class="mt-2 text-sm leading-6 text-text-secondary">
                {{ shortcut.description }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </section>
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
