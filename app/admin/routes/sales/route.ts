import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSalesClient, getTransactionsClient } from "@/lib/mongodb";
import { SalesSchema } from "@/lib/validators/sales";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

// Interface for sales header documents.
interface SalesDocument {
  _id?: { toString?: () => string } | string;
  createdAt?: { toISOString?: () => string } | string | Date;
  [key: string]: unknown;
}

//GET- Retrieve a sales header.
export async function GET() {
  try {
    // Sales Client check.
    const salesClient = await getSalesClient();

    if (!salesClient) {
      throw new Error("Sales database client could not be initialized.");
    }

    const salesDb = salesClient.db(env.MONGODB_SALES_DB || "sales");
    const salesCollection = salesDb.collection("sales");

    // Get the Sales Header references.

    const sales = await salesCollection
      .find({})
      .project({
        _id: 1,
        transactionId: 1,
        transactionNumber: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ transactionNumber: 1 })
      .toArray();

    // No Sales Headers saved yet.
    if (sales.length === 0) {
      return NextResponse.json(
        {
          success: true,
          sales: [],
        },
        { status: 200 },
      );
    }

    // Transaction Client check.
    const transactionsClient = await getTransactionsClient();

    if (!transactionsClient) {
      throw new Error("Transactions database client could not be initialized.");
    }

    const transactionsDb = transactionsClient.db(
      env.MONGODB_TRANSACTIONS_DB || "transactions",
    );

    const transactionsCollection = transactionsDb.collection("transactions");

    // Get all transaction numbers referenced by Sales Headers.
    const transactionNumbers = sales
      .map((sale) => String(sale.transactionNumber ?? "").trim())
      .filter(Boolean);

    // Retrieve the CURRENT versions of those transactions.
    const transactions = await transactionsCollection
      .find({
        transactionNumber: {
          $in: transactionNumbers,
        },
      })
      .project({
        _id: 1,
        transactionNumber: 1,
        transactionType: 1,
        customerCode: 1,
        date: 1,
        rows: 1,
        total: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .toArray();

    // Create a lookup map using said transactionNumber.
    const transactionMap = new Map(
      transactions.map((transaction) => [
        transaction.transactionNumber,
        transaction,
      ]),
    );

    //Base the current sales header on the current Transaction.
    const serialized = sales
      .map((sale) => {
        const transaction = transactionMap.get(
          String(sale.transactionNumber ?? "").trim(),
        );

        // The referenced transaction no longer exists.
        if (!transaction) {
          return null;
        }

        // The transaction was changed from SALES to another type.
        if (transaction.transactionType !== "SALES") {
          return null;
        }

        return {
          // Keep the Sales Header's own database identity, as well as the transactionId.
          _id: sale._id?.toString?.() ?? String(sale._id ?? ""),

          transactionId:
            sale.transactionId ?? transaction._id?.toString?.() ?? undefined,

          // Use the CURRENT transaction values.
          transactionNumber: transaction.transactionNumber,
          customerCode: transaction.customerCode ?? "",

          date:
            transaction.date instanceof Date
              ? transaction.date.toISOString().split("T")[0]
              : String(transaction.date ?? ""),

          rows: Array.isArray(transaction.rows) ? transaction.rows : [],

          total:
            typeof transaction.total === "number"
              ? transaction.total
              : Number(transaction.total) || 0,

          createdAt:
            sale.createdAt instanceof Date
              ? sale.createdAt.toISOString()
              : sale.createdAt,

          updatedAt:
            sale.updatedAt instanceof Date
              ? sale.updatedAt.toISOString()
              : sale.updatedAt,
        };
      })
      .filter((sale): sale is NonNullable<typeof sale> => sale !== null);

    return NextResponse.json(
      {
        success: true,
        sales: serialized,
      },
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

//POST- add a sales header to the database.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const client = await getSalesClient();
    if (!client) {
      throw new Error("Sales database client could not be initialized.");
    }

    const db = client.db(env.MONGODB_SALES_DB || "sales");
    const salesCollection = db.collection("sales");

    await salesCollection.createIndex(
      { transactionNumber: 1 },
      { unique: true },
    );

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

    const transactionsClient = await getTransactionsClient();

    if (!transactionsClient) {
      throw new Error("Transactions database client could not be initialized.");
    }

    const transactionsDb = transactionsClient.db(
      env.MONGODB_TRANSACTIONS_DB || "transactions",
    );

    const transactionsCollection = transactionsDb.collection("transactions");

    const transaction = await transactionsCollection.findOne({
      transactionNumber: sales.transactionNumber,
    });

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found.",
        },
        { status: 404 },
      );
    }

    if (transaction.transactionType !== "SALES") {
      return NextResponse.json(
        {
          success: false,
          message: "Selected transaction is not a SALES transaction.",
        },
        { status: 400 },
      );
    }

    // Check what URI/DB is running.
    try {
      console.log("MONGODB_SALES_URI present?", Boolean(env.MONGODB_SALES_URI));
      console.log("MONGODB_SALES_DB=", env.MONGODB_SALES_DB || "sales");
    } catch (e) {
      console.error("Failed to log env vars for MongoDB", e);
    }

    const salesDocument = {
      transactionId: transaction._id.toString(),
      transactionNumber: transaction.transactionNumber,
      customerCode: transaction.customerCode,
      date: transaction.date,
      rows: transaction.rows,
      total: transaction.total,
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
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This transaction is already in the Sales Header.",
        },
        { status: 409 },
      );
    }
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

//Update a sales header in the database.
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();

    const rawSalesId = formData.get("sales-id")?.toString().trim() ?? "";
    const rawSalesData = formData.get("sales-data")?.toString().trim() ?? "";

    if (!rawSalesId || !rawSalesData) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Header ID and sales data are required.",
        },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(rawSalesId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sales header ID.",
        },
        { status: 400 },
      );
    }

    let salesData: unknown;

    try {
      salesData = JSON.parse(rawSalesData);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sales data.",
        },
        { status: 400 },
      );
    }

    const validationResult = SalesSchema.safeParse(salesData);

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

    //Client check!

    const client = await getSalesClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_SALES_DB || "sales");
    const salesCollection = db.collection("sales");

    // Make sure the Sales Header being edited actually exists.
    const existingSales = await salesCollection.findOne({
      _id: new ObjectId(rawSalesId),
    });

    if (!existingSales) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Header not found.",
        },
        { status: 404 },
      );
    }

    const transactionsClient = await getTransactionsClient();

    if (!transactionsClient) {
      throw new Error("Transactions database client could not be initialized.");
    }

    const transactionsDb = transactionsClient.db(
      env.MONGODB_TRANSACTIONS_DB || "transactions",
    );

    const transactionsCollection = transactionsDb.collection("transactions");

    const transaction = await transactionsCollection.findOne({
      transactionNumber: sales.transactionNumber,
    });

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found.",
        },
        { status: 404 },
      );
    }

    if (transaction.transactionType !== "SALES") {
      return NextResponse.json(
        {
          success: false,
          message: "Selected transaction is not a SALES transaction.",
        },
        { status: 400 },
      );
    }

    const duplicateTransaction = await salesCollection.findOne({
      transactionNumber: sales.transactionNumber,
      _id: { $ne: new ObjectId(rawSalesId) },
    });

    if (duplicateTransaction) {
      return NextResponse.json(
        {
          success: false,
          message: "This transaction number already exists.",
        },
        { status: 409 },
      );
    }

    // Update the sales header.
    const updatedSalesData = {
      transactionId: transaction._id.toString(),
      transactionNumber: transaction.transactionNumber,
      customerCode: transaction.customerCode,
      date: transaction.date,
      rows: transaction.rows,
      total: transaction.total,
      updatedAt: new Date(),
    };

    const updatedSales = await salesCollection.updateOne(
      { _id: new ObjectId(rawSalesId) },
      {
        $set: updatedSalesData,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Sales updated successfully",
        modifiedCount: updatedSales.modifiedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Sales update failed:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Something went wrong while updating the sales",
      },
      { status: 500 },
    );
  }
}

//Delete a sales header in the database.
export async function DELETE(request: NextRequest) {
  try {
    //Find the form data from the request.
    const formData = await request.formData();

    const rawSalesId = formData.get("sales-id")?.toString().trim() ?? "";

    //Sales Validation
    if (!rawSalesId) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Header ID is required.",
        },
        { status: 400 },
      );
    }

    //Check for Sales ID.
    if (!ObjectId.isValid(rawSalesId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sales header ID.",
        },
        { status: 400 },
      );
    }

    //Is the client there?
    const client = await getSalesClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_SALES_DB || "sales");
    const salesCollection = db.collection("sales");

    //Delete the sales header.
    const deletedSales = await salesCollection.deleteOne({
      _id: new ObjectId(rawSalesId),
    });

    if (deletedSales.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Sales Header not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Sales Header deleted successfully",
        deletedCount: deletedSales.deletedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Sales Header deletion failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while deleting the sales header",
      },
      { status: 500 },
    );
  }
}
