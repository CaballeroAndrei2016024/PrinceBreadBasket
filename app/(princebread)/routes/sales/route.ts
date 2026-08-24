import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSalesClient, getReportsClient } from "@/lib/mongodb";
import { SalesSchema } from "@/lib/validators/sales";

export const runtime = "nodejs";

// Interface for reports documents.
interface SalesDocument {
  _id?: { toString?: () => string } | string;
  createdAt?: { toISOString?: () => string } | string | Date;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const client = await getSalesClient();
    // Client check.
    if (!client) {
      throw new Error("Sales database client could not be initialized.");
    }
    const db = client.db(env.MONGODB_SALES_DB || "sales");
    const salesCollection = db.collection("sales");
    const sales = await salesCollection
      .find({})
      .project({
        _id: 1,
        transactionNumber: 1,
        customerCode: 1,
        customerName: 1,
        date: 1,

        reportId: 1,
        reportTransaction: 1,

        productId: 1,
        productName: 1,
        productPrice: 1,

        periodStart: 1,
        periodEnd: 1,

        rows: 1,
        total: 1,

        createdAt: 1,
        updatedAt: 1,
      })
      .toArray();
    // Serialize ObjectId to string so JSON can be sent to the client
    const serialized = sales.map((sale: SalesDocument) => ({
      ...sale,

      _id: sale._id?.toString?.() ?? String(sale._id ?? ""),

      date:
        sale.date instanceof Date
          ? sale.date.toISOString().split("T")[0]
          : sale.date,

      periodStart:
        sale.periodStart instanceof Date
          ? sale.periodStart.toISOString().split("T")[0]
          : sale.periodStart,

      periodEnd:
        sale.periodEnd instanceof Date
          ? sale.periodEnd.toISOString().split("T")[0]
          : sale.periodEnd,

      createdAt:
        sale.createdAt instanceof Date
          ? sale.createdAt.toISOString()
          : sale.createdAt,

      updatedAt:
        sale.updatedAt instanceof Date
          ? sale.updatedAt.toISOString()
          : sale.updatedAt,
    }));

    return NextResponse.json(
      { success: true, sales: serialized },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch sales:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = SalesSchema.safeParse(body);

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
    const sales = validationResult.data;

    const reportsClient = await getReportsClient();

    if (!reportsClient) {
      throw new Error("Reports database client could not be initialized.");
    }

    const reportsDb = reportsClient.db(env.MONGODB_REPORTS_DB || "reports");

    const reportsCollection = reportsDb.collection("reports");

    const report = await reportsCollection.findOne({
      transactionNumber: sales.reportTransaction,
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found.",
        },
        { status: 404 },
      );
    }

    const client = await getSalesClient();
    // Check what URI/DB is running.
    try {
      console.log("MONGODB_SALES_URI present?", Boolean(env.MONGODB_SALES_URI));
      console.log("MONGODB_SALES_DB=", env.MONGODB_SALES_DB || "sales");
    } catch (e) {
      console.error("Failed to log env vars for MongoDB", e);
    }

    if (!client) {
      throw new Error("Sales database client could not be initialized.");
    }

    const db = client.db(env.MONGODB_SALES_DB || "sales");
    const salesCollection = db.collection("sales");

    const salesDocument = {
      transactionNumber: sales.transactionNumber,

      // Report ID.
      reportId: report._id.toString(),

      // Business transaction number from the Report Sheet as referrence.
      reportTransaction: sales.reportTransaction,

      customerCode: sales.customerCode,
      customerName: sales.customerName,
      date: sales.date,

      rows: sales.rows,
      total: sales.total,
      productId: report.productId,
      productName: report.productName,
      productPrice: report.productPrice,

      periodStart: report.periodStart,
      periodEnd: report.periodEnd,

      createdAt: new Date(),
    };

    const insertedSales = await salesCollection.insertOne(salesDocument);

    // Debug: Check where data is written.
    try {
      console.log(
        "Inserted into DB:",
        db.databaseName,
        "collection: sales, id:",
        insertedSales.insertedId.toString(),
      );
    } catch (e) {
      console.error("Failed to log insert info", e);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sales Header created successfully",
        insertedId: insertedSales.insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Sales Header submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while saving the sales header",
      },
      { status: 500 },
    );
  }
}
