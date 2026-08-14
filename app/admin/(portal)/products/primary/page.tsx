import React from "react";
import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/libauth";
import { env } from "@/lib/env";
import { getProductClient } from "@/lib/mongodb";
import AdminProductsList, {
  type AdminProduct,
} from "../components/productlist";

export const revalidate = 5; //5 second revalidation.

async function getProducts() {
  const client = await getProductClient();
  const db = client.db(env.MONGODB_PRODUCTS_DB || "products");
  const productsCollection = db.collection("products");
  const products = await productsCollection.find().toArray();

  return products.map((product) => ({
    ...product,
    _id: product._id?.toString?.() ?? product._id,
    productId: product.productId ?? "",
    productName: product.productName ?? "",
    productPrice:
      typeof product.productPrice === "number" ? product.productPrice : 0,
    createdAt: product.createdAt
      ? product.createdAt.toISOString()
      : product.createdAt,
  })) as AdminProduct[];
}

export default async function ProductPage() {
  const session = await getCurrentAdmin();

  if (!session) {
    redirect("/admin/login");
  }

  const products = await getProducts();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg">
        <h1
          className="text-2xl font-bold text-prince-yellow"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Products
        </h1>
        <p
          className="mt-2 text-sm text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          Displaying List of Products:
        </p>
      </div>

      <AdminProductsList products={products} />
    </div>
  );
}
