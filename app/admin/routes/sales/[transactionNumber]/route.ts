import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSalesClient } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ transactionNumber: string }> },
) {
  try {
    const { transactionNumber } = await params;

    if (!transactionNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "TransactionNumber is required",
        },
        { status: 400 },
      );
    }

    const client = await getSalesClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_SALES_DB || "sales");
    const salesCollection = db.collection("sales");

    const sales = await salesCollection.findOne({
      transactionNumber,
    });

    if (!sales) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales not found",
        },
        { status: 404 },
      );
    }

    const serializedSales = {
      ...sales,

      _id: sales._id.toString(),

      date:
        sales.date instanceof Date
          ? sales.date.toISOString().split("T")[0]
          : sales.date,

      periodStart:
        sales.periodStart instanceof Date
          ? sales.periodStart.toISOString().split("T")[0]
          : sales.periodStart,

      periodEnd:
        sales.periodEnd instanceof Date
          ? sales.periodEnd.toISOString().split("T")[0]
          : sales.periodEnd,

      createdAt:
        sales.createdAt instanceof Date
          ? sales.createdAt.toISOString()
          : sales.createdAt,

      updatedAt:
        sales.updatedAt instanceof Date
          ? sales.updatedAt.toISOString()
          : sales.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        sales: serializedSales,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch sales header:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales header",
      },
      { status: 500 },
    );
  }
}
