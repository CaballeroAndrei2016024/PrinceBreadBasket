import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSettingsClient } from "@/lib/mongo";
import { SettingsSchema } from "@/lib/validators/settings";

export const runtime = "nodejs";

// Interface for settings documents.
interface SettingsDocument {
  _id?: { toString?: () => string } | string;
  createdAt?: { toISOString?: () => string } | string | Date;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const client = await getSettingsClient();
    //Client check.
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    //Find the database.
    const db = client.db(env.MONGODB_SETTINGS_DB || "settings");
    const settingsCollection = db.collection("settings");
    const settings = await settingsCollection
      .find({})
      .project({
        _id: 1,
        businessName: 1,
        businessId: 1,
        businessType: 1,
        phone: 1,
        email: 1,
        vision: 1,
        mission: 1,
        history: 1,
        currency: 1,
        receiptPrefix: 1,
        createdAt: 1,
      })
      .toArray();
    // Serialize ObjectId to string so JSON can be sent to the client
    const serialized = settings.map((s: SettingsDocument) => ({
      ...s,
      _id: s._id?.toString?.() ?? s._id,
      createdAt:
        s.createdAt &&
        typeof s.createdAt !== "string" &&
        "toISOString" in s.createdAt &&
        typeof s.createdAt.toISOString === "function"
          ? s.createdAt.toISOString()
          : s.createdAt,
    }));

    return NextResponse.json(
      { success: true, products: serialized },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch products",
      },
      { status: 500 },
    );
  }
}

//POST- Add settings to the database.
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const rawSettingsId = formData.get("settings-id")?.toString().trim() ?? "";
    // Debug: log rawSettingsId received
    try {
      console.log("Received rawSettingsId:", rawSettingsId);
    } catch (e) {
      console.error(
        "The settingsId is not available right now. Please try again later",
        e,
      );
    }
    const rawBusinessName =
      formData.get("business-name")?.toString().trim() ?? "";
    const rawBusinessId = formData.get("business-id")?.toString().trim() ?? "";
    const rawBusinessType =
      formData.get("business-type")?.toString().trim() ?? "";
    const rawPhone = formData.get("phone")?.toString().trim() ?? "";
    const rawEmail = formData.get("email")?.toString().trim() ?? "";
    const rawCurrency = formData.get("currency")?.toString().trim() ?? "";
    const rawReceiptPrefix =
      formData.get("receipt-prefix")?.toString().trim() ?? "";

    const validationResult = SettingsSchema.safeParse({
      settingId: rawSettingsId,
      businessName: rawBusinessName,
      businessId: rawBusinessId,
      businessType: rawBusinessType,
      phone: rawPhone,
      email: rawEmail,
      currency: rawCurrency,
      receiptPrefix: rawReceiptPrefix,
    });

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
    const {
      businessName,
      businessId,
      businessType,
      phone,
      email,
      currency,
      receiptPrefix,
    } = validationResult.data;

    const client = await getSettingsClient();

    //Client check.
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }
    // Check what URI/DB is running.
    try {
      console.log("MONGODB_SETTINGS_URI=", env.MONGODB_SETTINGS_URI);
      console.log("MONGODB_SETTINGS_DB=", env.MONGODB_SETTINGS_DB);
    } catch (e) {
      console.error("Failed to log env vars for MongoDB", e);
    }

    const db = client.db(env.MONGODB_SETTINGS_DB || "settings");
    const settingsCollection = db.collection("settings");

    const insertedSetting = await settingsCollection.insertOne({
      businessName,
      businessId,
      businessType,
      phone,
      email,
      currency,
      receiptPrefix,
    });

    // Debug: Check where data is written.
    try {
      console.log(
        "Inserted into DB:",
        db.databaseName,
        "collection: settings, id:",
        insertedSetting.insertedId.toString(),
      );
    } catch (e) {
      console.error("Failed to log insert info", e);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Settings created successfully",
        insertedId: insertedSetting.insertedId.toString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Settings submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving the settings",
      },
      { status: 500 },
    );
  }
}
