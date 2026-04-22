import { apiFetchRaw } from "~/composables/apiFetch";
import type {
  ContactInquiryPayload,
  ContactInquiryResponse,
} from "~/types/contact";

export const useContactApi = () => {
  const submitContactInquiry = (payload: ContactInquiryPayload) =>
    apiFetchRaw<ContactInquiryResponse>("/pages/contact/inquiries/", {
      method: "POST",
      body: payload,
    });

  return {
    submitContactInquiry,
  };
};
