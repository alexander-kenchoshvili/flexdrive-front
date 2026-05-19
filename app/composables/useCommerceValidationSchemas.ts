import { z } from "zod";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requiredText = (message: string) => z.string().trim().min(1, message);

const checkoutSchema = z
  .object({
    buyer_type: z.enum(["individual", "legal_entity"]),
    company_name: z.string().trim(),
    company_identification_code: z.string().trim(),
    company_legal_address: z.string().trim(),
    first_name: requiredText("შეიყვანე სახელი."),
    last_name: requiredText("შეიყვანე გვარი."),
    email: z.string().trim().refine((value) => !value || emailPattern.test(value), {
      message: "ელფოსტის ფორმატი არასწორია.",
    }),
    phone: requiredText("შეიყვანე ტელეფონის ნომერი."),
    city: requiredText("შეიყვანე ქალაქი."),
    address_line: requiredText("შეიყვანე მისამართი."),
    note: z.string(),
    terms_accepted: z.boolean().refine((value) => value, {
      message: "შეკვეთის დასადასტურებლად დაეთანხმეთ წესებსა და პირობებს.",
    }),
    payment_method: z
      .enum(["cash_on_delivery", "card"])
      .refine((value) => value === "cash_on_delivery", {
        message: "ბარათით გადახდა მალე დაემატება.",
      }),
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

    if (!values.company_legal_address) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["company_legal_address"],
        message: "შეიყვანე იურიდიული მისამართი.",
      });
    }
  });

export const useCommerceValidationSchemas = () => {
  return {
    checkoutSchema,
  };
};
