//To validate everything in the Reports Schema before submitting.
import { z } from "zod";

//The schema for the rows in the "Report".
export const ReportRowSchema = z.object({
  id: z.string().trim().min(1, "Row ID is required."),
  productId: z.string().trim().min(1, "Product ID is required."),
  productName: z.string().trim().min(1, "Product name is required."),
  qty: z.coerce.number().gt(0, "Quantity must be greater than zero."),
  price: z.coerce.number().min(0, "Price cannot be negative."),
});

// The Main Schema.
export const ReportSchema = z
  .object({
    transactionNumber: z
      .string()
      .trim()
      .min(1, "Transaction number is required."),
    periodStart: z.string().trim().min(1, "Period start date is required."),
    periodEnd: z.string().trim().min(1, "Period end date is required."),
    rows: z
      .array(ReportRowSchema)
      .min(1, "At least one report row is required."),
    total: z.coerce.number().min(0, "Total cannot be negative."),
  })
  .superRefine((report, ctx) => {
    const rowTotal = report.rows.reduce(
      (sum, row) => sum + row.qty * row.price,
      0,
    );

    if (Math.abs(report.total - rowTotal) > 0.01) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["total"],
        message: "Total does not match the rows.",
      });
    }

    if (new Date(report.periodStart) > new Date(report.periodEnd)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["periodEnd"],
        message: "Period start cannot be later than period end.",
      });
    }
  });
