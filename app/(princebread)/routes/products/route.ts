import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getProductClient } from "@/lib/mongodb";
import { ProductSchema } from "@/lib/validators/products";

export const runtime = "nodejs";

// Interface for product documents.
interface ProductDocument {
  _id?: { toString?: () => string } | string;
  createdAt?: { toISOString?: () => string } | string | Date;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const client = await getProductClient();
    //Client check.
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }
    const db = client.db(env.MONGODB_PRODUCTS_DB || "products");
    const productsCollection = db.collection("products");
    const products = await productsCollection
      .find({})
      .project({
        _id: 1,
        productId: 1,
        productName: 1,
        productPrice: 1,
        productImage: 1,
        createdAt: 1,
      })
      .toArray();
    // Serialize ObjectId to string so JSON can be sent to the client
    const serialized = products.map((p: ProductDocument) => ({
      ...p,
      _id: p._id?.toString?.() ?? p._id,
      createdAt:
        p.createdAt &&
        typeof p.createdAt !== "string" &&
        "toISOString" in p.createdAt &&
        typeof p.createdAt.toISOString === "function"
          ? p.createdAt.toISOString()
          : p.createdAt,
    }));

    return NextResponse.json(
      { success: true, products: serialized },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
      },
      { status: 500 },
    );
  }
}

//POST- add a product to the database.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const rawProductId = formData.get("product-id")?.toString().trim() ?? "";
    // Debug: log rawProductId received
    try {
      console.log("Received rawProductId:", rawProductId);
    } catch (e) {
      console.error(
        "The productId is not available right now. Please try again later",
        e,
      );
    }
    const rawProductName =
      formData.get("product-name")?.toString().trim() ?? "";
    const rawProductPrice = formData.get("product-price")?.toString() ?? "";
    const rawProductImage = formData.get("product-image");

    const productImage =
      rawProductImage instanceof File ? rawProductImage : null;
    const parsedProductPrice = Number(rawProductPrice);

    const validationResult = ProductSchema.safeParse({
      productId: rawProductId,
      productName: rawProductName,
      productPrice: parsedProductPrice,
      productImage,
    });

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation failed",
          errors: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }
    const {
      productId,
      productName,
      productPrice,
      productImage: uploadedFile,
    } = validationResult.data;
    const imageBuffer = Buffer.from(await uploadedFile.arrayBuffer());
    const imageBase64 = imageBuffer.toString("base64");

    const client = await getProductClient();
    const db = client.db(env.MONGODB_PRODUCTS_DB || "products");
    const productsCollection = db.collection("products");

    const insertedProduct = await productsCollection.insertOne({
      productId,
      productName,
      productPrice,
      productImage: {
        fileName: uploadedFile.name,
        mimeType: uploadedFile.type,
        size: uploadedFile.size,
        data: imageBase64,
      },
      createdAt: new Date(),
    });

    // Debug: Check where data is written.
    try {
      console.log(
        "Inserted into DB:",
        db.databaseName,
        "collection: products, id:",
        insertedProduct.insertedId.toString(),
      );
    } catch (e) {
      console.error("Failed to log insert info", e);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Product created successfully",
        insertedId: insertedProduct.insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Product submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving the product",
      },
      { status: 500 },
    );
  }
}
