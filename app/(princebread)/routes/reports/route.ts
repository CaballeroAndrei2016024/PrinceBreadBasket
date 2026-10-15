import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getReportsClient } from "@/lib/mongodb";
import { getCurrentSalesHeaderByTransactionNumber } from "@/lib/business-logic-necessities/sales-headers";
import { ReportSchema } from "@/lib/validators/reports";
import { getCurrentSalesReports } from "@/lib/business-logic-necessities/sales-reports";

export const runtime = "nodejs";

// GET - Fetch reports using the current Sales Header data.
export async function GET() {
  try {
    const reports = await getCurrentSalesReports();

    return NextResponse.json(
      {
        success: true,
        reports,
      },
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
      console.log(
        "MONGODB_REPORTS_URI present?",
        Boolean(env.MONGODB_REPORTS_URI),
        "MONGODB_REPORTS_DB present?",
        Boolean(env.MONGODB_REPORTS_DB),
      );
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
