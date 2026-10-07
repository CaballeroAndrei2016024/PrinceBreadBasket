import { z } from "zod";

//The schema for each row in the transaction form.
export const TransactionRowSchema = z.object({
  id: z.string().trim().min(1, "Row ID is required."),
  productId: z.string().trim().min(1, "Please select a product."),
  productName: z.string().trim().min(1, "Product name is required."),
  qty: z.coerce.number().gt(0, "Quantity must be greater than zero."),
  price: z.coerce.number().min(0, "Unit price cannot be negative."),
});

//Main schema for transactions.
export const TransactionSchema = z
  .object({
    transactionNumber: z
      .string()
      .trim()
      .min(1, "Transaction number is required."),
    customerCode: z.string().trim().default(""),
    transactionType: z.enum(["BEGINNING_INVENTORY", "ADDITION", "SALES"]),
    date: z.string().trim().min(1, "Transaction date is required."),
    rows: z
      .array(TransactionRowSchema)
      .min(1, "At least one transaction row is required."),
    total: z.coerce.number().min(0, "Total cannot be negative."),
  })
  .superRefine((transaction, ctx) => {
    // Customers are mandatory only for Sales.
    if (transaction.transactionType === "SALES" && !transaction.customerCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customerCode"],
        message: "Customer is required for Sales transactions.",
      });
    }
    const rowTotal = transaction.rows.reduce(
      (sum, row) => sum + row.qty * row.price,
      0,
    );

    if (Math.abs(transaction.total - rowTotal) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["total"],
        message: "Total does not match the rows.",
      });
    }
  });
