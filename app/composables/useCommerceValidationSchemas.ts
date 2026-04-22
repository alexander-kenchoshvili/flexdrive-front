import { z } from "zod";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requiredText = (message: string) => z.string().trim().min(1, message);

const checkoutSchema = z.object({
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
});

export const useCommerceValidationSchemas = () => {
  return {
    checkoutSchema,
  };
};
