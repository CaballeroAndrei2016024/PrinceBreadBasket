import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getCustomerClient } from "@/lib/mongodb";
import { CustomerSchema } from "@/lib/validators/customer";
import { generateCustomerCode } from "@/lib/business-logic-necessities/customer-code";

export const runtime = "nodejs";

// Interface for customerdocuments.
interface CustomerDocument {
  _id?: { toString?: () => string } | string;
  createdAt?: { toISOString?: () => string } | string | Date;
  [key: string]: unknown;
}

// GET - fetch a customer from the database.
export async function GET() {
  try {
    const client = await getCustomerClient();
    //Client check.
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }
    const db = client.db(env.MONGODB_CUSTOMERS_DB || "customers");
    const customersCollection = db.collection("customers");
    const customers = await customersCollection
      .find({})
      .project({
        _id: 1,
        customerCode: 1,
        customerName: 1,
        birthDate: 1,
        address: 1,
        phoneNumber: 1,
        customerImage: 1,
        createdAt: 1,
      })
      .toArray();
    // Serialize ObjectId to string so JSON can be sent to the client
    const serialized = customers.map((p: CustomerDocument) => ({
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
      { success: true, customers: serialized },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customers",
      },
      { status: 500 },
    );
  }
}

// POST - add a customer to the database.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const rawCustomerName =
      formData.get("customer-name")?.toString().trim() ?? "";
    const rawCustomerImage = formData.get("customer-image");

    const customerImage =
      rawCustomerImage instanceof File ? rawCustomerImage : null;

    const client = await getCustomerClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_CUSTOMERS_DB || "customers");
    const customersCollection = db.collection("customers");

    // Generate customer code automatically.
    const customerCode = await generateCustomerCode(db);

    const validationResult = CustomerSchema.safeParse({
      customerCode,
      customerName: rawCustomerName,
      birthDate: formData.get("birthdate")?.toString().trim() ?? "",
      address: formData.get("address")?.toString().trim() ?? "",
      phoneNumber: formData.get("phone")?.toString().trim() ?? "",
      customerImage,
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
      customerCode: validatedCustomerCode,
      customerName,
      birthDate,
      address,
      phoneNumber,
      customerImage: uploadedFile,
    } = validationResult.data;

    const imageBuffer = Buffer.from(await uploadedFile.arrayBuffer());
    const imageBase64 = imageBuffer.toString("base64");

    const insertedCustomer = await customersCollection.insertOne({
      customerCode: validatedCustomerCode,
      customerName,
      birthDate,
      address,
      phoneNumber,
      customerImage: {
        fileName: uploadedFile.name,
        mimeType: uploadedFile.type,
        size: uploadedFile.size,
        data: imageBase64,
      },
      createdAt: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Customer created successfully",
        customerCode: validatedCustomerCode,
        insertedId: insertedCustomer.insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Customer submission failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving the customer",
      },
      { status: 500 },
    );
  }
}
