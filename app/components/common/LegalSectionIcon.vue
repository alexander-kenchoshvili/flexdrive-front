<script setup lang="ts">
import {
  ArchiveBoxIcon,
  BanknotesIcon,
  ChatBubbleLeftRightIcon,
  CheckBadgeIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  LockClosedIcon,
  MapPinIcon,
  ReceiptRefundIcon,
  ShareIcon,
  ShieldCheckIcon,
  TagIcon,
  TruckIcon,
  UserCircleIcon,
} from "@heroicons/vue/24/outline";
import type { Component } from "vue";
import type { LegalSectionIconName } from "~/composables/useLegalPageSections";

const props = defineProps<{
  name: LegalSectionIconName;
}>();

const iconComponents: Record<LegalSectionIconName, Component> = {
  archive: ArchiveBoxIcon,
  banknotes: BanknotesIcon,
  card: CreditCardIcon,
  chat: ChatBubbleLeftRightIcon,
  check: CheckBadgeIcon,
  clipboard: ClipboardDocumentCheckIcon,
  clock: ClockIcon,
  document: DocumentTextIcon,
  exclamation: ExclamationTriangleIcon,
  eye: EyeIcon,
  lock: LockClosedIcon,
  map: MapPinIcon,
  refund: ReceiptRefundIcon,
  share: ShareIcon,
  shield: ShieldCheckIcon,
  tag: TagIcon,
  truck: TruckIcon,
  user: UserCircleIcon,
};

const iconComponent = computed(() => iconComponents[props.name]);
</script>

<template>
  <component :is="iconComponent" aria-hidden="true" />
</template>
