import { z } from "zod";

const requiredText = (message: string) =>
  z.string().trim().min(1, message);

const contactInquirySchema = z.object({
  full_name: requiredText("სახელი და გვარი სავალდებულოა."),
  phone: requiredText("ტელეფონის ნომერი სავალდებულოა."),
  email: requiredText("ელფოსტა სავალდებულოა.").email(
    "შეიყვანეთ სწორი ელფოსტა.",
  ),
  topic_slug: requiredText("აირჩიეთ საკითხის თემა."),
  order_number: z.string().trim().optional(),
  message: requiredText("შეტყობინება სავალდებულოა."),
});

export const useContactValidationSchemas = () => {
  return {
    contactInquirySchema,
  };
};
