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

//Update a customer in the database.
export async function PUT(request: NextRequest) {
  try {
    //Find the form data from the request.
    const formData = await request.formData();

    const rawCustomerCode =
      formData.get("customer-code")?.toString().trim() ?? "";
    const rawCustomerName =
      formData.get("customer-name")?.toString().trim() ?? "";
    const birthDate = formData.get("birthdate")?.toString().trim() ?? "";
    const address = formData.get("address")?.toString().trim() ?? "";
    const phoneNumber = formData.get("phone")?.toString().trim() ?? "";
    const rawCustomerImage = formData.get("customer-image");

    const customerImage =
      rawCustomerImage instanceof File ? rawCustomerImage : null;

    if (!rawCustomerCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer Code is required",
        },
        { status: 400 },
      );
    }

    if (!rawCustomerName) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer name is required",
        },
        { status: 400 },
      );
    }

    if (!birthDate || !address || !phoneNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Birth date, address, and phone number are required",
        },
        { status: 400 },
      );
    }

    const client = await getCustomerClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_CUSTOMERS_DB || "customers");
    const customersCollection = db.collection("customers");

    const currentCustomer = await customersCollection.findOne({
      customerCode: rawCustomerCode,
    });

    if (!currentCustomer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 },
      );
    }

    const finalCustomerImage = customerImage
      ? {
          fileName: customerImage.name,
          mimeType: customerImage.type,
          size: customerImage.size,
          data: Buffer.from(await customerImage.arrayBuffer()).toString(
            "base64",
          ),
        }
      : currentCustomer.customerImage;

    const updatedCustomer = await customersCollection.updateOne(
      { customerCode: rawCustomerCode },
      {
        $set: {
          customerImage: finalCustomerImage,
          customerName: rawCustomerName,
          birthDate,
          address,
          phoneNumber,
          updatedAt: new Date(),
        },
      },
    );

    if (updatedCustomer.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Customer updated successfully",
        modifiedCount: updatedCustomer.modifiedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Customer update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while updating the customer",
      },
      { status: 500 },
    );
  }
}

//Delete a customer in the database.
export async function DELETE(request: NextRequest) {
  try {
    const formData = await request.formData();

    const customerCode = formData.get("customer-code")?.toString().trim() ?? "";

    if (!customerCode) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer Code is required",
        },
        { status: 400 },
      );
    }

    const client = await getCustomerClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_CUSTOMERS_DB || "customers");

    const customersCollection = db.collection("customers");

    const deletedCustomer = await customersCollection.deleteOne({
      customerCode: customerCode,
    });

    if (deletedCustomer.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Customer deleted successfully",
        deletedCount: deletedCustomer.deletedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Customer deletion failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while deleting the customer",
      },
      { status: 500 },
    );
  }
}
