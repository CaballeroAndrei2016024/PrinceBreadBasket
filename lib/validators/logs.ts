//To validate everything in the Logs Schema before submitting.
import { z } from "zod";

//The schema for the rows in the "Sales Log".
export const LogRowSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  productName: z.string().min(1),
  qty: z.number().min(0, "Quantity must be a non-negative number."),
  price: z.number().min(0, "Unit price cannot be negative."),
});

// The Main Schema.
export const LogSchema = z
  .object({
    periodStart: z.string().min(1, "Period start date is required."),
    periodEnd: z.string().min(1, "Period end date is required."),

    beginningRows: z.array(LogRowSchema),
    additionRows: z.array(LogRowSchema),
    salesRows: z.array(LogRowSchema),
    endingRows: z.array(LogRowSchema),
  })
  .refine((data) => new Date(data.periodStart) <= new Date(data.periodEnd), {
    message: "Period start cannot be later than period end.",
    path: ["periodEnd"],
  });
