import { z } from "zod";

const customerImageSchema = z
  .instanceof(File, {
    message: "Please upload an image file",
  })
  .refine(
    (file) =>
      ["image/jpeg", "image/png", "image/gif", "image/jpg"].includes(file.type),
    {
      message: "Only JPG, PNG, and GIF images are allowed",
    },
  )
  .refine((file) => file.size <= 5 * 1024 * 1024, {
    message: "Image must be less than 5MB",
  });

//The main schema for the Customer.
export const CustomerSchema = z.object({
  customerCode: z.string().min(1, "Customer code is required"),
  customerName: z.string().min(1, "Customer name is required"),
  birthDate: z.string().min(1, "Birth date is required"),
  address: z.string().min(1, "Address is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  customerImage: customerImageSchema,
});
