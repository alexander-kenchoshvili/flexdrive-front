<script setup lang="ts">
import BaseInput from "~/components/common/BaseInput.vue";
import BaseTextarea from "~/components/common/BaseTextarea.vue";
import CheckoutPaymentMethodCard from "~/components/commerce/CheckoutPaymentMethodCard.vue";
import CheckoutSectionHeader from "~/components/commerce/CheckoutSectionHeader.vue";
import type { CheckoutFieldErrors } from "~/composables/commerce/useCheckoutForm";
import type { CheckoutPaymentMethod } from "~/types/commerce";

defineProps<{
  disabled?: boolean;
  errors: CheckoutFieldErrors;
  firstNameAttrs?: Record<string, unknown>;
  lastNameAttrs?: Record<string, unknown>;
  emailAttrs?: Record<string, unknown>;
  phoneAttrs?: Record<string, unknown>;
  cityAttrs?: Record<string, unknown>;
  addressLineAttrs?: Record<string, unknown>;
  noteAttrs?: Record<string, unknown>;
}>();

const firstName = defineModel<string>("firstName", { required: true });
const lastName = defineModel<string>("lastName", { required: true });
const email = defineModel<string>("email", { required: true });
const phone = defineModel<string>("phone", { required: true });
const city = defineModel<string>("city", { required: true });
const addressLine = defineModel<string>("addressLine", { required: true });
const note = defineModel<string>("note", { required: true });
const termsAccepted = defineModel<boolean>("termsAccepted", { required: true });
const paymentMethod = defineModel<CheckoutPaymentMethod>("paymentMethod", {
  required: true,
});

const emit = defineEmits<{
  selectPaymentMethod: [method: CheckoutPaymentMethod];
}>();
</script>

<template>
  <section
    class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
  >
    <CheckoutSectionHeader :step="1" title="საკონტაქტო ინფორმაცია" />

    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <BaseInput
        v-model="firstName"
        v-bind="firstNameAttrs"
        name="first_name"
        data-checkout-field="first_name"
        label="სახელი *"
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
        label="გვარი *"
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
        placeholder="შეიყვანე ნომერი"
        :error="errors.phone"
        :disabled="disabled"
        required
      />
    </div>
  </section>

  <section
    class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
  >
    <CheckoutSectionHeader :step="2" title="მიწოდების მისამართი" />
    <p class="mt-6 text-sm leading-6 text-text-secondary">
      მიუთითე ქალაქი და ზუსტი მისამართი, რომ ოპერატორმა მიწოდება სწორად
      დაგიზუსტოს.
    </p>

    <div class="mt-6 grid gap-4 md:grid-cols-2">
      <BaseInput
        v-model="city"
        v-bind="cityAttrs"
        name="city"
        data-checkout-field="city"
        label="ქალაქი *"
        autocomplete="address-level2"
        placeholder="მაგალითად: თბილისი"
        :error="errors.city"
        :disabled="disabled"
        required
      />

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
        required
      />
    </div>
  </section>

  <section
    data-checkout-field="terms_accepted"
    class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
  >
    <CheckoutSectionHeader :step="3" title="წესები და პირობები" />
    <p class="mt-6 text-sm leading-6 text-text-secondary">
      შეკვეთის დადასტურებამდე აუცილებელია დაეთანხმო წესებსა და პირობებს.
    </p>

    <label
      class="mt-6 flex items-start gap-3 rounded-[18px] border border-border-default/80 bg-surface-2 px-4 py-3 text-sm font-medium text-text-secondary transition-colors duration-200"
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
          class="relative inline-block pb-[2px] font-semibold text-accent-primary no-underline after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current after:opacity-60 after:content-[''] transition-colors duration-200 hover:text-accent-hover dark:text-[#ff8b63] dark:hover:text-[#ffb090]"
          @click.stop
        >
          წესებსა და პირობებს
        </NuxtLink>
        და
        <NuxtLink
          to="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          class="relative inline-block pb-[2px] font-semibold text-accent-primary no-underline after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:bg-current after:opacity-60 after:content-[''] transition-colors duration-200 hover:text-accent-hover dark:text-[#ff8b63] dark:hover:text-[#ffb090]"
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
    class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
  >
    <CheckoutSectionHeader :step="4" title="გადახდის მეთოდი" />
    <p class="mt-6 text-sm leading-6 text-text-secondary">
      ამ ეტაპზე სრულად ხელმისაწვდომია ნაღდი ანგარიშსწორება. ბარათით გადახდა მალე
      დაემატება.
    </p>

    <div class="mt-6 grid gap-4">
      <CheckoutPaymentMethodCard
        method="cash_on_delivery"
        title="ნაღდი ანგარიშსწორება"
        description="გადახდა მოხდება შეკვეთის მიღების დროს, მიტანისას."
        :selected="paymentMethod === 'cash_on_delivery'"
        @select="emit('selectPaymentMethod', $event)"
      />

      <CheckoutPaymentMethodCard
        method="card"
        title="ბარათით გადახდა"
        description="ონლაინ გადახდის ინტეგრაცია მზადდება და მალე გახდება ხელმისაწვდომი."
        :selected="paymentMethod === 'card'"
        badge="მალე"
        disabled
        @select="emit('selectPaymentMethod', $event)"
      />
    </div>

    <p v-if="errors.payment_method" class="mt-3 text-sm text-error">
      {{ errors.payment_method }}
    </p>
  </section>

  <section
    class="rounded-[24px] border border-border-default bg-surface p-6 shadow-[0_24px_60px_-38px_var(--shadow-color)] md:p-7"
  >
    <CheckoutSectionHeader :step="5" title="დამატებითი ინფორმაცია" />

    <BaseTextarea
      v-model="note"
      v-bind="noteAttrs"
      name="note"
      data-checkout-field="note"
      class="mt-6"
      label="კომენტარი შეკვეთაზე"
      placeholder="თუ გინდა, მიუთითე დამატებითი დეტალი შეკვეთასთან დაკავშირებით."
      :error="errors.note"
      :disabled="disabled"
      :rows="5"
    />
  </section>
</template>
