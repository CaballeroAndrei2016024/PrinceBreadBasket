import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getProductClient } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ productId: string }> },
) {
  try {
    const { productId } = await params;
    const trimmedProductId = productId.trim();

    if (!trimmedProductId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required",
        },
        { status: 400 },
      );
    }

    const client = await getProductClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_PRODUCTS_DB || "products");
    const productsCollection = db.collection("products");

    const product = await productsCollection.findOne({
      productId: trimmedProductId,
    });

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found",
        },
        { status: 404 },
      );
    }

    const serializedProduct = {
      ...product,
      _id: product._id.toString(),
      createdAt:
        product.createdAt instanceof Date
          ? product.createdAt.toISOString()
          : product.createdAt,
      updatedAt:
        product.updatedAt instanceof Date
          ? product.updatedAt.toISOString()
          : product.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        product: serializedProduct,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch product:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch product",
      },
      { status: 500 },
    );
  }
}
