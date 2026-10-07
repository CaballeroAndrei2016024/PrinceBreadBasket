import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getReportsClient } from "@/lib/mongodb";
import { getCurrentSalesHeaderByTransactionNumber } from "@/lib/business-logic-necessities/sales-headers";
import { ReportSchema } from "@/lib/validators/reports";

export const runtime = "nodejs";

// Interface for reports documents.
interface ReportsDocument {
  _id?: { toString?: () => string } | string;
  createdAt?: { toISOString?: () => string } | string | Date;
  [key: string]: unknown;
}

//GET- Fetches a report from the database.
export async function GET() {
  try {
    const client = await getReportsClient();
    // Client check.
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }
    const db = client.db(env.MONGODB_REPORTS_DB || "reports");
    const reportsCollection = db.collection("reports");
    const reports = await reportsCollection
      .find({})
      .project({
        _id: 1,
        transactionNumber: 1,
        productId: 1,
        productName: 1,
        productPrice: 1,
        periodStart: 1,
        periodEnd: 1,
        total: 1,
        rows: 1,
        createdAt: 1,
      })
      .toArray();
    // Serialize ObjectId to string so JSON can be sent to the client
    const serialized = reports.map((p: ReportsDocument) => ({
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
      { success: true, reports: serialized },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch reports:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch reports",
      },
      { status: 500 },
    );
  }
}

//POST- Adds a report to the database.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const client = await getReportsClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_REPORTS_DB || "reports");
    const reportsCollection = db.collection("reports");

    const salesHeader = await getCurrentSalesHeaderByTransactionNumber(
      String(body?.transactionNumber ?? "").trim(),
    );

    if (!salesHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Header not found.",
        },
        { status: 404 },
      );
    }

    const reportInput = {
      transactionNumber: salesHeader.transactionNumber,
      periodStart: String(body?.periodStart ?? "").trim(),
      periodEnd: String(body?.periodEnd ?? "").trim(),
      rows: salesHeader.rows,
      total: salesHeader.total,
    };

    const validationResult = ReportSchema.safeParse(reportInput);

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

    const report = validationResult.data;

    // Check what URI/DB is running.
    try {
      console.log("MONGODB_REPORTS_URI=", env.MONGODB_REPORTS_URI);
      console.log("MONGODB_REPORTS_DB=", env.MONGODB_REPORTS_DB);
    } catch (e) {
      console.error("Failed to log env vars for MongoDB", e);
    }

    const insertedReport = await reportsCollection.insertOne({
      ...report,
      createdAt: new Date(),
    });

    // Debug: Check where data is written.
    try {
      console.log(
        "Inserted into DB:",
        db.databaseName,
        "collection: reports, id:",
        insertedReport.insertedId.toString(),
      );
    } catch (e) {
      console.error("Failed to log insert info", e);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Report created successfully",
        insertedId: insertedReport.insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Report submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving the report",
      },
      { status: 500 },
    );
  }
}
