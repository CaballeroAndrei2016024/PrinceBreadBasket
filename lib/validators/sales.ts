import { z } from "zod";

//The schema for each row in the sales header form.
export const TransactionRowSchema = z.object({
  id: z.string(),
  productId: z.string().min(1, "Product ID is required."),
  productName: z.string().min(1, "Product name is required."),
  qty: z.number().min(0, "Quantity cannot be negative"),
  price: z.number().min(0, "Price cannot be negative"),
});

//The main schema for the Sales Header.
export const SalesSchema = z.object({
  transactionNumber: z.string().min(1, "Transaction number is required."),
});
