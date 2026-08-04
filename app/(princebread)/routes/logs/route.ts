import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getLogsClient } from "@/lib/mongodb";
import { LogSchema } from "@/lib/validators/logs";

export const runtime = "nodejs";

// Interface for logs documents.
interface LogsDocument {
  _id?: { toString?: () => string } | string;
  createdAt?: { toISOString?: () => string } | string | Date;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const client = await getLogsClient();
    // Client check.
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }
    const db = client.db(env.MONGODB_LOGS_DB || "logs");
    const logsCollection = db.collection("logs");
    const logs = await logsCollection.find({}).toArray();
    // Serialize ObjectId to string so JSON can be sent to the client
    const serialized = logs.map((p: LogsDocument) => ({
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
      { success: true, logs: serialized },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch logs:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch logs",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = LogSchema.safeParse(body);

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
    const log = validationResult.data;

    const client = await getLogsClient();
    // Check what URI/DB is running.
    try {
      console.log("MONGODB_LOGS_URI=", env.MONGODB_LOGS_URI);
      console.log("MONGODB_LOGS_DB=", env.MONGODB_LOGS_DB);
    } catch (e) {
      console.error("Failed to log env vars for MongoDB", e);
    }

    // Client check.
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_LOGS_DB || "logs");
    const logsCollection = db.collection("logs");

    const insertedLogs = await logsCollection.insertOne({
      ...log,
      createdAt: new Date(),
    });

    // Debug: Check where data is written.
    try {
      console.log(
        "Inserted into DB:",
        db.databaseName,
        "collection: logs, id:",
        insertedLogs.insertedId.toString(),
      );
    } catch (e) {
      console.error("Failed to log insert info", e);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sales Log created successfully",
        insertedId: insertedLogs.insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Sales Log submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving the sales log",
      },
      { status: 500 },
    );
  }
}

//jsdihsdijsdijsad
