import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getLogsClient } from "@/lib/mongodb";

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

    const client = await getLogsClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_LOGS_DB || "logs");
    const logsCollection = db.collection("logs");

    const log = await logsCollection.findOne({
      transactionNumber,
    });

    if (!log) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Log not found",
        },
        { status: 404 },
      );
    }

    const serializedLog = {
      ...log,
      _id: log._id.toString(),
      createdAt:
        log.createdAt instanceof Date
          ? log.createdAt.toISOString()
          : log.createdAt,
      updatedAt:
        "updatedAt" in log && log.updatedAt instanceof Date
          ? log.updatedAt.toISOString()
          : "updatedAt" in log
            ? log.updatedAt
            : undefined,
    };

    return NextResponse.json(
      {
        success: true,
        report: serializedLog,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch sales log:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch sales log",
      },
      { status: 500 },
    );
  }
}
