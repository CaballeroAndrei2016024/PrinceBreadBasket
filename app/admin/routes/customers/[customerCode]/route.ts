import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getCustomerClient } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerCode: string }> },
) {
  try {
    const { customerCode } = await params;
    const trimmedCustomerCode = customerCode.trim();

    if (!trimmedCustomerCode) {
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

    const customer = await customersCollection.findOne({
      customerCode: trimmedCustomerCode,
    });

    if (!customer) {
      return NextResponse.json(
        {
          success: false,
          message: "Customer not found",
        },
        { status: 404 },
      );
    }

    const serializedCustomer = {
      ...customer,
      _id: customer._id.toString(),
      createdAt:
        customer.createdAt instanceof Date
          ? customer.createdAt.toISOString()
          : customer.createdAt,
      updatedAt:
        customer.updatedAt instanceof Date
          ? customer.updatedAt.toISOString()
          : customer.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        customer: serializedCustomer,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch customer:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch customer",
      },
      { status: 500 },
    );
  }
}
