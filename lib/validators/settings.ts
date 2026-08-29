//To validate settings into Zod.
import { z } from "zod";

export const SettingsSchema = z.object({
  businessName: z.string().min(1),
  businessId: z.string().min(1),
  businessType: z.string().min(1),
  businessImage: z.string().optional(),

  phone: z.string(),
  email: z.string(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  history: z.string().optional(),

  currency: z.enum(["PHP", "USD", "EUR"]),
  receiptPrefix: z.string(),
});

export type Settings = z.infer<typeof SettingsSchema>;
