<script setup lang="ts">
import BaseInput from "~/components/common/BaseInput.vue";
import BaseSelect, {
  type BaseSelectOption,
} from "~/components/common/BaseSelect.vue";
import BaseTextarea from "~/components/common/BaseTextarea.vue";
import CheckoutPaymentMethodCard from "~/components/commerce/CheckoutPaymentMethodCard.vue";
import CheckoutSectionHeader from "~/components/commerce/CheckoutSectionHeader.vue";
import {
  CHECKOUT_CASH_ON_DELIVERY_ENABLED,
  type CheckoutFieldErrors,
} from "~/composables/commerce/useCheckoutForm";
import type {
  CheckoutBuyerType,
  CheckoutPaymentMethod,
  CommerceDeliveryRegion,
} from "~/types/commerce";

const props = defineProps<{
  disabled?: boolean;
  cardPaymentEnabled?: boolean;
  cardPaymentLoading?: boolean;
  errors: CheckoutFieldErrors;
  companyNameAttrs?: Record<string, unknown>;
  companyIdentificationCodeAttrs?: Record<string, unknown>;
  firstNameAttrs?: Record<string, unknown>;
  lastNameAttrs?: Record<string, unknown>;
  emailAttrs?: Record<string, unknown>;
  phoneAttrs?: Record<string, unknown>;
  addressLineAttrs?: Record<string, unknown>;
  noteAttrs?: Record<string, unknown>;
  deliveryRegionOptions: BaseSelectOption[];
  deliveryCityOptions: BaseSelectOption[];
  selectedDeliveryRegion?: CommerceDeliveryRegion | null;
  deliveryRegionsPending?: boolean;
  deliveryCitiesPending?: boolean;
  deliveryLocationsError?: string | null;
}>();

const buyerType = defineModel<CheckoutBuyerType>("buyerType", {
  required: true,
});
const companyName = defineModel<string>("companyName", { required: true });
const companyIdentificationCode = defineModel<string>(
  "companyIdentificationCode",
  { required: true },
);
const firstName = defineModel<string>("firstName", { required: true });
const lastName = defineModel<string>("lastName", { required: true });
const email = defineModel<string>("email", { required: true });
const phone = defineModel<string>("phone", { required: true });
const deliveryRegionId = defineModel<number | null>("deliveryRegionId", {
  required: true,
});
const deliveryCityId = defineModel<number | null>("deliveryCityId", {
  required: true,
});
const addressLine = defineModel<string>("addressLine", { required: true });
const note = defineModel<string>("note", { required: true });
const termsAccepted = defineModel<boolean>("termsAccepted", { required: true });
const paymentMethod = defineModel<CheckoutPaymentMethod>("paymentMethod", {
  required: true,
});

const emit = defineEmits<{
  selectPaymentMethod: [method: CheckoutPaymentMethod];
  retryDeliveryLocations: [];
}>();

const buyerTypeOptions: Array<{
  value: CheckoutBuyerType;
  title: string;
  description: string;
}> = [
  {
    value: "individual",
    title: "ფიზიკური პირი",
    description: "შეკვეთა გაფორმდება პირად საკონტაქტო მონაცემებზე.",
  },
  {
    value: "legal_entity",
    title: "იურიდიული პირი",
    description: "შეკვეთას დაემატება კომპანიის რეკვიზიტები.",
  },
];

const isLegalBuyer = computed(() => buyerType.value === "legal_entity");
const firstNameLabel = computed(() =>
  isLegalBuyer.value ? "საკონტაქტო პირის სახელი *" : "სახელი *",
);
const lastNameLabel = computed(() =>
  isLegalBuyer.value ? "საკონტაქტო პირის გვარი *" : "გვარი *",
);

const deliveryCityLabel = computed(() =>
  props.selectedDeliveryRegion?.is_internal_delivery
    ? "უბანი / დასახლება *"
    : "ქალაქი / დასახლება *",
);

const deliveryHint = computed(() => {
  if (!deliveryRegionId.value) {
    return "ჯერ აირჩიე რეგიონი, შემდეგ ქალაქი ან დასახლება.";
  }

  if (props.deliveryCitiesPending) {
    return "ქალაქებისა და დასახლებების ჩამონათვალი იტვირთება.";
  }

  return props.selectedDeliveryRegion?.is_internal_delivery
    ? "თბილისში მიწოდებას FlexDrive-ის გუნდი ასრულებს."
    : "რეგიონულ მიწოდებას პარტნიორი საკურიერო სერვისი ასრულებს.";
});
</script>

<template>
  <section
    class="rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:p-6 md:p-7"
  >
    <CheckoutSectionHeader :step="1" title="მყიდველის ინფორმაცია" />

    <div
      data-checkout-field="buyer_type"
      class="mt-4 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2"
    >
      <label
        v-for="option in buyerTypeOptions"
        :key="option.value"
        class="flex min-w-0 cursor-pointer items-start gap-3 rounded-[18px] border p-3 text-left transition-colors duration-200 sm:gap-4 sm:rounded-[20px] sm:p-5"
        :class="[
          buyerType === option.value
            ? 'border-accent-primary bg-accent-primary/8 shadow-[0_18px_44px_-34px_rgba(255,107,53,0.4)]'
            : 'border-border-default bg-surface-2 hover:border-accent-primary/60 hover:bg-surface',
          disabled ? 'cursor-not-allowed opacity-70' : '',
          errors.buyer_type ? 'border-error/40' : '',
        ]"
      >
        <input
          v-model="buyerType"
          type="radio"
          name="buyer_type"
          class="mt-1 h-4 w-4 shrink-0 border-border-default bg-surface accent-accent-primary"
          :value="option.value"
          :disabled="disabled"
        />

        <span class="min-w-0">
          <span class="block text-sm font-semibold text-text-primary">
            {{ option.title }}
          </span>
          <span class="mt-1 block text-xs leading-5 text-text-secondary sm:text-sm sm:leading-6">
            {{ option.description }}
          </span>
        </span>
      </label>
    </div>

    <p v-if="errors.buyer_type" class="mt-3 text-sm text-error">
      {{ errors.buyer_type }}
    </p>

    <div
      v-if="isLegalBuyer"
      class="mt-4 grid gap-3 rounded-[20px] border border-border-default bg-surface-2 p-3 sm:mt-6 sm:gap-4 sm:p-4 md:grid-cols-2"
    >
      <BaseInput
        v-model="companyName"
        v-bind="companyNameAttrs"
        name="company_name"
        data-checkout-field="company_name"
        label="კომპანიის დასახელება *"
        autocomplete="organization"
        placeholder="მაგალითად: შპს FlexDrive"
        :error="errors.company_name"
        :disabled="disabled"
        required
      />

      <BaseInput
        v-model="companyIdentificationCode"
        v-bind="companyIdentificationCodeAttrs"
        name="company_identification_code"
        data-checkout-field="company_identification_code"
        label="საიდენტიფიკაციო კოდი *"
        inputmode="numeric"
        maxlength="9"
        placeholder="9-ნიშნა კოდი"
        :error="errors.company_identification_code"
        :disabled="disabled"
        required
      />
    </div>

    <div class="mt-4 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
      <BaseInput
        v-model="firstName"
        v-bind="firstNameAttrs"
        name="first_name"
        data-checkout-field="first_name"
        :label="firstNameLabel"
        autocomplete="given-name"
        placeholder="შეიყვანე სახელი"
        :error="errors.first_name"
        :disabled="disabled"
        required
      />

      <BaseInput
        v-model="lastName"
        v-bind="lastNameAttrs"
        name="last_name"
        data-checkout-field="last_name"
        :label="lastNameLabel"
        autocomplete="family-name"
        placeholder="შეიყვანე გვარი"
        :error="errors.last_name"
        :disabled="disabled"
        required
      />

      <BaseInput
        v-model="email"
        v-bind="emailAttrs"
        name="email"
        data-checkout-field="email"
        label="ელფოსტა (არასავალდებულო)"
        type="email"
        autocomplete="email"
        placeholder="name@example.com"
        :error="errors.email"
        :disabled="disabled"
      />

      <BaseInput
        v-model="phone"
        v-bind="phoneAttrs"
        name="phone"
        data-checkout-field="phone"
        label="ტელეფონის ნომერი *"
        type="tel"
        autocomplete="tel"
        inputmode="tel"
        placeholder="555 12 34 56"
        hint="ფორმატი: 555 12 34 56 ან +995 555 12 34 56"
        :error="errors.phone"
        :disabled="disabled"
        required
      />
    </div>
  </section>

  <section
    class="rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:p-6 md:p-7"
  >
    <CheckoutSectionHeader :step="2" title="მიწოდების მისამართი" />
    <p class="mt-4 text-sm leading-6 text-text-secondary sm:mt-6">
      აირჩიე მიწოდების რეგიონი და დასახლება, შემდეგ მიუთითე ზუსტი მისამართი.
    </p>

    <div class="mt-4 grid gap-3 sm:mt-6 sm:gap-4 md:grid-cols-2">
      <div data-checkout-field="delivery_region_id">
        <BaseSelect
          v-model="deliveryRegionId"
          name="delivery_region_id"
          label="რეგიონი *"
          :options="deliveryRegionOptions"
          :placeholder="deliveryRegionsPending ? 'იტვირთება...' : 'აირჩიე რეგიონი'"
          :empty-text="deliveryRegionsPending ? 'იტვირთება...' : 'რეგიონები ვერ მოიძებნა'"
          :error="errors.delivery_region_id"
          :disabled="disabled || deliveryRegionsPending"
          searchable
          search-placeholder="მოძებნე რეგიონი"
        />
      </div>

      <div data-checkout-field="delivery_city_id">
        <BaseSelect
          v-model="deliveryCityId"
          name="delivery_city_id"
          :label="deliveryCityLabel"
          :options="deliveryCityOptions"
          :placeholder="
            !deliveryRegionId
              ? 'ჯერ აირჩიე რეგიონი'
              : deliveryCitiesPending
                ? 'იტვირთება...'
                : 'აირჩიე ქალაქი ან დასახლება'
          "
          :empty-text="deliveryCitiesPending ? 'იტვირთება...' : 'ჩამონათვალი ცარიელია'"
          :error="
            deliveryRegionId ? errors.delivery_city_id || errors.city : ''
          "
          :disabled="disabled || !deliveryRegionId || deliveryCitiesPending"
          searchable
          search-placeholder="მოძებნე ქალაქი ან დასახლება"
        />
      </div>

      <BaseInput
        v-model="addressLine"
        v-bind="addressLineAttrs"
        name="address_line"
        data-checkout-field="address_line"
        label="მისამართი *"
        autocomplete="street-address"
        placeholder="ქუჩა, ნომერი, ბინა"
        :error="errors.address_line"
        :disabled="disabled"
        class="md:col-span-2"
        required
      />
    </div>

    <div
      v-if="deliveryLocationsError"
      class="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-[16px] border border-error/25 bg-error/8 px-3 py-2.5 text-sm text-error"
      role="alert"
    >
      <span>{{ deliveryLocationsError }}</span>
      <button
        type="button"
        class="font-semibold underline decoration-current/40 underline-offset-4 transition-opacity hover:opacity-75"
        :disabled="disabled"
        @click="emit('retryDeliveryLocations')"
      >
        ხელახლა ცდა
      </button>
    </div>

    <p v-else class="mt-3 text-xs leading-5 text-text-muted">
      {{ deliveryHint }}
    </p>
  </section>

  <section
    data-checkout-field="terms_accepted"
    class="rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:p-6 md:p-7"
  >
    <CheckoutSectionHeader :step="3" title="წესები და პირობები" />
    <p class="mt-4 text-sm leading-6 text-text-secondary sm:mt-6">
      შეკვეთის დადასტურებამდე აუცილებელია დაეთანხმო წესებსა და პირობებს.
    </p>

    <label
      class="mt-4 flex items-start gap-3 rounded-[18px] border border-border-default/80 bg-surface-2 px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors duration-200 sm:mt-6 sm:px-4 sm:py-3"
      :class="errors.terms_accepted ? 'border-error/40 text-error' : ''"
    >
      <input
        v-model="termsAccepted"
        type="checkbox"
        class="mt-0.5 h-4 w-4 rounded border border-border-default bg-surface accent-accent-primary"
        :disabled="disabled"
      />
      <span>
        ვეთანხმები
        <NuxtLink
          to="/terms"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold text-accent-primary no-underline transition-colors duration-200 hover:text-accent-hover dark:text-[#ff8b63] dark:hover:text-[#ffb090]"
          @click.stop
        >
          წესებსა და პირობებს
        </NuxtLink>
        და
        <NuxtLink
          to="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          class="font-semibold text-accent-primary no-underline transition-colors duration-200 hover:text-accent-hover dark:text-[#ff8b63] dark:hover:text-[#ffb090]"
          @click.stop
        >
          კონფიდენციალურობის პოლიტიკას
        </NuxtLink>
      </span>
    </label>

    <p v-if="errors.terms_accepted" class="mt-3 text-sm text-error">
      {{ errors.terms_accepted }}
    </p>
  </section>

  <section
    data-checkout-field="payment_method"
    class="rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:p-6 md:p-7"
  >
    <CheckoutSectionHeader :step="4" title="გადახდა" />
    <p class="mt-4 text-sm leading-6 text-text-secondary sm:mt-6">
      აირჩიე შენთვის მოსახერხებელი გადახდის მეთოდი.
    </p>

    <div class="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
      <CheckoutPaymentMethodCard
        v-if="CHECKOUT_CASH_ON_DELIVERY_ENABLED"
        method="cash_on_delivery"
        title="ნაღდი ანგარიშსწორება"
        description="დროებითი სატესტო რეჟიმი — თანხა გადაიხდება შეკვეთის მიღებისას."
        :selected="paymentMethod === 'cash_on_delivery'"
        :disabled="disabled"
        @select="emit('selectPaymentMethod', $event)"
      />

      <CheckoutPaymentMethodCard
        method="card"
        title="ბარათით გადახდა"
        :description="
          cardPaymentLoading
            ? 'ხელმისაწვდომობა მოწმდება.'
            : cardPaymentEnabled
              ? ''
              : 'ბარათით გადახდა ამ მომენტში მიუწვდომელია.'
        "
        :selected="paymentMethod === 'card'"
        :badge="
          cardPaymentLoading
            ? 'მოწმდება'
            : cardPaymentEnabled
              ? ''
              : 'მიუწვდომელია'
        "
        :brands="cardPaymentEnabled ? ['Visa', 'Mastercard', 'American Express'] : []"
        :disabled="disabled || cardPaymentLoading || !cardPaymentEnabled"
        @select="emit('selectPaymentMethod', $event)"
      />
    </div>

    <p v-if="errors.payment_method" class="mt-3 text-sm text-error">
      {{ errors.payment_method }}
    </p>
  </section>

  <section
    class="rounded-[24px] border border-border-default bg-surface p-4 shadow-[0_24px_60px_-38px_var(--shadow-color)] sm:p-6 md:p-7"
  >
    <CheckoutSectionHeader :step="5" title="დამატებითი ინფორმაცია" />

    <BaseTextarea
      v-model="note"
      v-bind="noteAttrs"
      name="note"
      data-checkout-field="note"
      class="mt-4 sm:mt-6"
      label="კომენტარი შეკვეთაზე"
      placeholder="თუ გინდა, მიუთითე დამატებითი დეტალი შეკვეთასთან დაკავშირებით."
      :error="errors.note"
      :disabled="disabled"
      :rows="5"
    />
  </section>
</template>
