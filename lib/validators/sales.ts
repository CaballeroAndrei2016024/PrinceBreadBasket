import { z } from "zod";

//The schema for each row in the sales header form.
export const TransactionRowSchema = z.object({
  id: z.string(),
  date: z.string().min(1, "Row date is required"),
  qty: z.number().min(0, "Quantity cannot be negative"),
  price: z.number().min(0, "Price cannot be negative"),
});

//The main schema for the Sales Header.
export const SalesSchema = z.object({
  customerCode: z.string().min(1, "Customer code is required"),
  transactionNumber: z.string().min(1, "Transaction number is required"),

  reportId: z.string().min(1, "Report ID is required"),

  reportTransaction: z.string().min(1, "Report transaction is required"),

  productId: z.string().min(1, "Product ID is required"),
  productName: z.string().min(1, "Product name is required"),
  productPrice: z.number().min(0, "Product price cannot be negative"),

  date: z.string().min(1, "Date is required"),

  periodStart: z.string().min(1, "Period start is required"),

  periodEnd: z.string().min(1, "Period end is required"),

  rows: z
    .array(TransactionRowSchema)
    .min(1, "At least one transaction row is required"),

  total: z.number().min(0, "Total cannot be negative"),
});
