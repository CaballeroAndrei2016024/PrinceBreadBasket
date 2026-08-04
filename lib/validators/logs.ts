//To validate everything in the Logs Schema before submitting.
import { z } from "zod";

export const InventoryRowSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1, "Please select a product."),
  qty: z.number().min(0, "Quantity cannot be negative."),
  price: z.number().min(0, "Price cannot be negative."),
});

export const LogSchema = z.object({
  transactionNumber: z.string().min(1, "Transaction Number is required."),

  periodStart: z.string().min(1, "Period Start is required."),

  periodEnd: z.string().min(1, "Period End is required."),

  beginningRows: z
    .array(InventoryRowSchema)
    .min(1, "Beginning Inventory is required."),

  additionRows: z.array(InventoryRowSchema),

  endingRows: z.array(InventoryRowSchema),
});
