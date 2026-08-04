//To validate everything in the Sales Schema before submitting.
import { z } from "zod";

//The schema for the rows in the "Sales Header".
export const TransactionRowSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Row date is required"),
  qty: z.number().min(0, "Quantity cannot be negative"),
  price: z.number().min(0, "Price cannot be negative"),
});

// The Main Schema.
export const SalesSchema = z.object({
  customerCode: z.string().min(1, "Customer code is required"),
  customerName: z.string().min(1, "Customer name is required"),
  transactionNumber: z.string().min(1, "Transaction number is required"),
  date: z.string().min(1, "Date is required"),

  // In order to make the row passing possible.
  rows: z
    .array(TransactionRowSchema)
    .min(1, "At least one transaction row is required"),

  total: z.number().min(0, "Total cannot be negative"),
});
