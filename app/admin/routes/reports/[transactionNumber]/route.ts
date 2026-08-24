import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getReportsClient } from "@/lib/mongodb";

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

    const client = await getReportsClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_REPORTS_DB || "reports");
    const reportsCollection = db.collection("reports");

    const report = await reportsCollection.findOne({
      transactionNumber,
    });

    if (!report) {
      return NextResponse.json(
        {
          success: false,
          message: "Report not found",
        },
        { status: 404 },
      );
    }

    const serializedReport = {
      ...report,
      _id: report._id.toString(),
      createdAt:
        report.createdAt instanceof Date
          ? report.createdAt.toISOString()
          : report.createdAt,
      updatedAt:
        report.updatedAt instanceof Date
          ? report.updatedAt.toISOString()
          : report.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        report: serializedReport,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch report:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch report",
      },
      { status: 500 },
    );
  }
}
