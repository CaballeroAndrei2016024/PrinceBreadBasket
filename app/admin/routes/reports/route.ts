import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getReportsClient } from "@/lib/mongodb";
import { getCurrentSalesHeaderByTransactionNumber } from "@/lib/business-logic-necessities/sales-headers";
import { ReportSchema } from "@/lib/validators/reports";
import { ObjectId } from "mongodb";

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

// Update a report in the database.
export async function PUT(request: NextRequest) {
  try {
    // Read form data.
    const formData = await request.formData();

    const rawReportId = formData.get("report-id")?.toString().trim() ?? "";

    const rawReportData = formData.get("report-data")?.toString().trim() ?? "";

    // Validate required fields.
    if (!rawReportId || !rawReportData) {
      return NextResponse.json(
        {
          success: false,
          message: "Report ID and report data are required.",
        },
        { status: 400 },
      );
    }

    // Validate MongoDB Report ID.
    if (!ObjectId.isValid(rawReportId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report ID.",
        },
        { status: 400 },
      );
    }

    const reportId = new ObjectId(rawReportId);

    // Parse report data.
    let reportData: unknown;

    try {
      reportData = JSON.parse(rawReportData);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report data.",
        },
        { status: 400 },
      );
    }

    if (
      !reportData ||
      typeof reportData !== "object" ||
      Array.isArray(reportData)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report data.",
        },
        { status: 400 },
      );
    }

    const parsedReportData = reportData as {
      transactionNumber?: unknown;
      periodStart?: unknown;
      periodEnd?: unknown;
    };

    const transactionNumber = String(
      parsedReportData.transactionNumber ?? "",
    ).trim();

    const periodStart = String(parsedReportData.periodStart ?? "").trim();

    const periodEnd = String(parsedReportData.periodEnd ?? "").trim();

    if (!transactionNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction number is required.",
        },
        { status: 400 },
      );
    }

    // Get Reports database client.
    const reportsClient = await getReportsClient();

    if (!reportsClient) {
      throw new Error("Reports database client could not be initialized.");
    }

    const reportsDb = reportsClient.db(env.MONGODB_REPORTS_DB || "reports");

    const reportsCollection = reportsDb.collection("reports");

    // Make sure the report exists.
    const existingReport = await reportsCollection.findOne({
      _id: reportId,
    });

    if (!existingReport) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found.",
        },
        { status: 404 },
      );
    }

    // Get the source Sales Header.
    const salesHeader =
      await getCurrentSalesHeaderByTransactionNumber(transactionNumber);

    if (!salesHeader) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Header not found.",
        },
        { status: 404 },
      );
    }

    // Build the report from the Sales Header.
    const reportInput = {
      transactionNumber: salesHeader.transactionNumber,
      periodStart,
      periodEnd,
      rows: salesHeader.rows,
      total: salesHeader.total,
    };

    // Validate the final report.
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

    const validatedReportData = validationResult.data;

    // Update the report.
    const updatedReport = await reportsCollection.updateOne(
      { _id: reportId },
      {
        $set: {
          ...validatedReportData,
          updatedAt: new Date(),
        },
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Report updated successfully",
        modifiedCount: updatedReport.modifiedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Report update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while updating the report",
      },
      { status: 500 },
    );
  }
}

// Delete a report in the database.
export async function DELETE(request: NextRequest) {
  try {
    const formData = await request.formData();

    const rawReportId = formData.get("report-id")?.toString().trim() ?? "";

    // Validate Report ID.
    if (!rawReportId) {
      return NextResponse.json(
        {
          success: false,
          message: "Report ID is required.",
        },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(rawReportId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report ID.",
        },
        { status: 400 },
      );
    }

    const client = await getReportsClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_REPORTS_DB || "reports");

    const reportsCollection = db.collection("reports");

    const deletedReport = await reportsCollection.deleteOne({
      _id: new ObjectId(rawReportId),
    });

    if (deletedReport.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Report deleted successfully",
        deletedCount: deletedReport.deletedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Report deletion failed:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while deleting the report",
      },
      { status: 500 },
    );
  }
}
