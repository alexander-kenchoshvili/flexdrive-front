import { z } from "zod";

const passwordHint =
  "გამოიყენეთ მინიმუმ 8 სიმბოლო. მოერიდეთ მარტივ და მხოლოდ ციფრებისგან შემდგარ პაროლებს.";

const emailSchema = z
  .string()
  .trim()
  .min(1, "ელფოსტა სავალდებულოა.")
  .email("შეიყვანეთ სწორი ელფოსტა.");

const passwordSchema = z
  .string()
  .min(8, "პაროლი მინიმუმ 8 სიმბოლოს უნდა შეიცავდეს.")
  .refine((value) => !/^\d+$/.test(value), {
    message: "პაროლი მხოლოდ ციფრებისგან არ უნდა შედგებოდეს.",
  });

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "პაროლი სავალდებულოა."),
});

const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, "გაიმეორეთ პაროლი."),
    termsAccepted: z.boolean().refine((value) => value, {
      message:
        "რეგისტრაციის გასაგრძელებლად დაეთანხმეთ წესებსა და კონფიდენციალურობის პოლიტიკას.",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "პაროლები არ ემთხვევა.",
  });

const forgotPasswordSchema = z.object({
  email: emailSchema,
});

const resendActivationSchema = z.object({
  email: emailSchema,
});

const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, "გაიმეორეთ პაროლი."),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "პაროლები არ ემთხვევა.",
  });

export const useAuthValidationSchemas = () => {
  return {
    passwordHint,
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resendActivationSchema,
    resetPasswordSchema,
  };
};
