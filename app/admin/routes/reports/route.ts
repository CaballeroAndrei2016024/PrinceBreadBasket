import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getReportsClient } from "@/lib/mongodb";
import { ReportSchema } from "@/lib/validators/reports";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

// Interface for reports documents.
interface ReportsDocument {
  _id?: { toString?: () => string } | string;
  createdAt?: { toISOString?: () => string } | string | Date;
  [key: string]: unknown;
}

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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = ReportSchema.safeParse(body);

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

    const client = await getReportsClient();
    // Check what URI/DB is running.
    try {
      console.log("MONGODB_REPORTS_URI=", env.MONGODB_REPORTS_URI);
      console.log("MONGODB_REPORTS_DB=", env.MONGODB_REPORTS_DB);
    } catch (e) {
      console.error("Failed to log env vars for MongoDB", e);
    }

    // Client check.
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_REPORTS_DB || "reports");
    const reportsCollection = db.collection("reports");

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

//Update a report in the database.
export async function PUT(request: NextRequest) {
  try {
    //Find the form data from the request.
    const formData = await request.formData();

    const rawReportId = formData.get("report-id")?.toString().trim() ?? "";
    const rawReportData = formData.get("report-data")?.toString().trim() ?? "";

    //Report Validation
    if (!rawReportId || !rawReportData) {
      return NextResponse.json(
        {
          success: false,
          message: "Your Report is incomplete. Please fill EVERYTHING up.",
        },
        { status: 400 },
      );
    }

    let reportData;

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

    //Validate report fields.

    const validationResult = ReportSchema.safeParse(reportData);

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

    //Is the client there?
    const client = await getReportsClient();
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }
    const db = client.db(env.MONGODB_REPORTS_DB || "reports");
    const reportsCollection = db.collection("reports");

    //Check for Report ID.
    if (!ObjectId.isValid(rawReportId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report ID.",
        },
        { status: 400 },
      );
    }

    //Update the report.
    const updatedReport = await reportsCollection.updateOne(
      { _id: new ObjectId(rawReportId) },
      {
        $set: {
          ...validatedReportData,
          updatedAt: new Date(),
        },
      },
    );

    if (updatedReport.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found",
        },
        { status: 404 },
      );
    }

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
        message: "Something went wrong while updating the report",
      },
      { status: 500 },
    );
  }
}

//Delete a report in the database.
export async function DELETE(request: NextRequest) {
  try {
    //Find the form data from the request.
    const formData = await request.formData();

    const rawReportId = formData.get("report-id")?.toString().trim() ?? "";

    //Report Validation
    if (!rawReportId) {
      return NextResponse.json(
        {
          success: false,
          message: "Report ID is required.",
        },
        { status: 400 },
      );
    }

    //Check for Report ID.
    if (!ObjectId.isValid(rawReportId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid report ID.",
        },
        { status: 400 },
      );
    }

    //Is the client there?
    const client = await getReportsClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_REPORTS_DB || "reports");
    const reportsCollection = db.collection("reports");

    //Delete the report.
    const deletedReport = await reportsCollection.deleteOne({
      _id: new ObjectId(rawReportId),
    });

    if (deletedReport.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found",
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
        message: "Something went wrong while deleting the report",
      },
      { status: 500 },
    );
  }
}
