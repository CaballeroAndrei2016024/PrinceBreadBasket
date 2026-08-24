import { notFound } from "next/navigation";
import ProductDetail from "../components/productdetails";
import { env } from "@/lib/env";
import { getProductClient } from "@/lib/mongodb";

type PageProps = {
  params: Promise<{
    productId: string;
  }>;
};

//The product info as shown by the admin module.
type ProductRecord = {
  _id?: { toString?: () => string } | string;
  productId?: string;
  productName?: string;
  productPrice?: number;
  productImage?: {
    fileName?: string;
    mimeType?: string;
    size?: number;
    data?: string;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

//Find a product by its productId.
async function getProductById(productId: string) {
  //Client check.
  const client = await getProductClient();
  if (!client) {
    throw new Error("Database client is null. Connection failed.");
  }

  const db = client.db(env.MONGODB_PRODUCTS_DB || "products");
  const product = (await db
    .collection("products")
    .findOne({ productId })) as ProductRecord | null;

  if (!product) {
    return null;
  }

  return {
    ...product,
    _id: product._id?.toString?.() ?? "",
    productId: product.productId ?? "",
    productName: product.productName ?? "",
    productPrice:
      typeof product.productPrice === "number" ? product.productPrice : 0,
    productImage: product.productImage,
    createdAt:
      product.createdAt instanceof Date
        ? product.createdAt.toISOString()
        : (product.createdAt ?? ""),
    updatedAt:
      product.updatedAt instanceof Date
        ? product.updatedAt.toISOString()
        : (product.updatedAt ?? ""),
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { productId } = await params;
  const product = await getProductById(productId.trim());

  if (!product) {
    notFound();
  }

  return (
    <ProductDetail
      _id={product._id}
      productId={product.productId}
      productName={product.productName}
      productPrice={product.productPrice}
      productImage={product.productImage}
      createdAt={product.createdAt}
    />
  );
}
