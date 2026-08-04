//To validate everything in the Products Schema before submitting.

import { z } from "zod";

const productImageSchema = z
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

export const ProductSchema = z.object({
  productId: z.string().min(1, { message: "Product ID is required." }),
  productName: z.string().min(1, { message: "Product name is required." }),
  productPrice: z.number().min(0, {
    message:
      "There is absolutely no way you can sell that and somehow manage to actually lose money. No, that's not how that works!",
  }),
  productImage: productImageSchema,
});
