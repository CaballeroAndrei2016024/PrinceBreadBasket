//To validate business settings into Zod.
import { z } from "zod";

export const BusinessSettingsSchema = z.object({
  businessName: z.string().min(1),
  businessId: z.string().min(1),
  businessType: z.string().min(1),

  phone: z.string(),
  email: z.string(),

  address: z.string(),
  barangay: z.string(),
  city: z.string(),
  province: z.string(),
  zip: z.string(),

  currency: z.enum(["PHP", "USD", "EUR"]),
  taxRate: z.number().min(0),
  receiptPrefix: z.string(),

  lowStockThreshold: z.number().min(0),
  allowNegativeInventory: z.boolean(),
  automaticInventoryDeduction: z.boolean(),
});

export type BusinessSettings = z.infer<typeof BusinessSettingsSchema>;
