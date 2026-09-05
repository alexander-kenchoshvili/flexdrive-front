import { z } from "zod";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const georgianMobilePattern = /^(?:5\d{8}|(?:\+?995)5\d{8})$/;

const requiredText = (message: string) => z.string().trim().min(1, message);

const requiredSelectionId = (message: string) =>
  z.number().int().positive().nullable().refine((value) => value !== null, {
    message,
  });

const georgianMobile = requiredText("შეიყვანე ტელეფონის ნომერი.").refine(
  (value) => {
    const compactValue = value.replace(/[\s()-]/g, "");
    return georgianMobilePattern.test(compactValue);
  },
  {
    message: "შეიყვანე ქართული მობილურის ნომერი, მაგალითად: 555 12 34 56.",
  },
);

const checkoutSchema = z
  .object({
    buyer_type: z.enum(["individual", "legal_entity"]),
    company_name: z.string().trim(),
    company_identification_code: z.string().trim(),
    company_is_vat_registered: z.boolean().nullable(),
    first_name: requiredText("შეიყვანე სახელი."),
    last_name: requiredText("შეიყვანე გვარი."),
    email: z.string().trim().refine((value) => !value || emailPattern.test(value), {
      message: "ელფოსტის ფორმატი არასწორია.",
    }),
    phone: georgianMobile,
    delivery_region_id: requiredSelectionId("აირჩიე რეგიონი."),
    delivery_city_id: requiredSelectionId("აირჩიე ქალაქი ან დასახლება."),
    city: requiredText("შეიყვანე ქალაქი."),
    address_line: requiredText("შეიყვანე მისამართი."),
    note: z.string(),
    terms_accepted: z.boolean().refine((value) => value, {
      message: "შეკვეთის დასადასტურებლად დაეთანხმეთ წესებსა და პირობებს.",
    }),
    payment_method: z.enum(["cash_on_delivery", "card"]),
  })
  .superRefine((values, context) => {
    if (values.buyer_type !== "legal_entity") {
      return;
    }

    if (!values.company_name) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["company_name"],
        message: "შეიყვანე კომპანიის დასახელება.",
      });
    }

    if (values.company_is_vat_registered === null) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["company_is_vat_registered"],
        message: "აირჩიე, არის თუ არა კომპანია დღგ-ის გადამხდელი.",
      });
    }

    if (!values.company_identification_code) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["company_identification_code"],
        message: "შეიყვანე საიდენტიფიკაციო კოდი.",
      });
    } else if (!/^\d{9}$/.test(values.company_identification_code)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["company_identification_code"],
        message: "შეიყვანე 9-ნიშნა საიდენტიფიკაციო კოდი.",
      });
    }
  });

export const useCommerceValidationSchemas = () => {
  return {
    checkoutSchema,
  };
};
