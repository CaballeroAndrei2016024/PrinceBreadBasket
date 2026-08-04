//To validate everything in the Reports Schema before submitting.
import { z } from "zod";

//The schema for the rows in the "Report".
export const TransactionRowSchema = z.object({
  id: z.string(),
  date: z.string().min(1, "Row date is required"),
  qty: z.number().min(0, "Quantity cannot be negative"),
  price: z.number().min(0, "Price cannot be negative"),
});

// The Main Schema.
export const ReportSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required"),
  productPrice: z.number().min(0, "Product price cannot be negative"),

  transactionNumber: z.string().min(1, "Transaction number is required"),
  periodStart: z.string().min(1, "Period start date is required"),
  periodEnd: z.string().min(1, "Period end date is required"),

  // In order to make the row passing possible.
  rows: z
    .array(TransactionRowSchema)
    .min(1, "At least one transaction row is required"),

  total: z.number().min(0, "Total cannot be negative"),
});
