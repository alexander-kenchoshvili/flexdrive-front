import { z } from "zod";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const requiredText = (message: string) => z.string().trim().min(1, message);

const accountProfileSchema = z.object({
  first_name: requiredText("შეიყვანე სახელი."),
  last_name: requiredText("შეიყვანე გვარი."),
  email: requiredText("შეიყვანე ელფოსტა.").refine(
    (value) => emailPattern.test(value),
    {
      message: "ელფოსტის ფორმატი არასწორია.",
    },
  ),
  phone: requiredText("შეიყვანე ტელეფონის ნომერი."),
  city: requiredText("შეიყვანე ქალაქი."),
  address_line: requiredText("შეიყვანე მისამართი."),
});

export const useAccountValidationSchemas = () => {
  return {
    accountProfileSchema,
  };
};
