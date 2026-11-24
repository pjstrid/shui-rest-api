import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string({ error: "Username is required" })
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(15, "Username can be at most 15 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Username can only contain letters and digits"),
    
  // At least one uppercase, one lowercase, one number and one special character
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must contain an uppercase letter, a lowercase letter, a number and a special character (@$!%*?&)",
    ),
});

export const loginSchema = z.object({
  username: z
    .string({ error: "Username is required" })
    .trim()
    .min(1, "Username is required"),
  password: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});
