import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getLogsClient } from "@/lib/mongodb";
import { LogSchema } from "@/lib/validators/logs";
import { ObjectId } from "mongodb";

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

export async function PUT(request: NextRequest) {
  try {
    //Find the form data from the request.
    const formData = await request.formData();

    const rawLogId = formData.get("logId")?.toString().trim() ?? "";

    const rawLogData = formData.get("logData")?.toString().trim() ?? "";

    //Sales Log Validation
    if (!rawLogId || !rawLogData) {
      return NextResponse.json(
        {
          success: false,
          message: "Your Sales Log is incomplete. Please fill EVERYTHING up.",
        },
        { status: 400 },
      );
    }

    let logsData;

    try {
      logsData = JSON.parse(rawLogData);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sales log data.",
        },
        { status: 400 },
      );
    }

    //Validate sales log fields.

    const validationResult = LogSchema.safeParse(logsData);

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

    const validatedLogsData = validationResult.data;

    //Is the client there?
    const client = await getLogsClient();
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }
    const db = client.db(env.MONGODB_LOGS_DB || "logs");
    const logsCollection = db.collection("logs");

    //Check for Log ID.
    if (!ObjectId.isValid(rawLogId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sales log ID.",
        },
        { status: 400 },
      );
    }

    //Update the sales log.
    const updatedLogs = await logsCollection.updateOne(
      { _id: new ObjectId(rawLogId) },
      {
        $set: {
          ...validatedLogsData,
          updatedAt: new Date(),
        },
      },
    );
    if (updatedLogs.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Log not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sales Log updated successfully",
        modifiedCount: updatedLogs.modifiedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Sales Log edit failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Sorry, that sales log is staying like that.",
      },
      { status: 500 },
    );
  }
}

//Delete a log in the database.
export async function DELETE(request: NextRequest) {
  try {
    //Find the form data from the request.
    const formData = await request.formData();

    const rawLogId = formData.get("log-id")?.toString().trim() ?? "";

    //Sales Log Validation
    if (!rawLogId) {
      return NextResponse.json(
        {
          success: false,
          message: "Report ID is required.",
        },
        { status: 400 },
      );
    }

    //Check for Sales Log ID.
    if (!ObjectId.isValid(rawLogId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sales log ID.",
        },
        { status: 400 },
      );
    }

    //Is the client there?
    const client = await getLogsClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_LOGS_DB || "logs");
    const logsCollection = db.collection("logs");

    //Delete the sales log.
    const deletedLog = await logsCollection.deleteOne({
      _id: new ObjectId(rawLogId),
    });

    if (deletedLog.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Log not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Report deleted successfully",
        deletedCount: deletedLog.deletedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Sales Log deletion failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while deleting the sales log.",
      },
      { status: 500 },
    );
  }
}
