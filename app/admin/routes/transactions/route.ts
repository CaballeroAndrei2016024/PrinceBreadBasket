import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getTransactionsClient } from "@/lib/mongodb";
import { TransactionSchema } from "@/lib/validators/transaction";
import type { AdminTransactionRow } from "@/app/admin/types";
import { priceTransactionRows } from "@/lib/business-logic-necessities/transaction-pricing";
import { generateTransactionNumber } from "@/lib/business-logic-necessities/transaction-number";

export const runtime = "nodejs";

// Interface for transaction documents.
interface TransactionDocument {
  _id?: { toString?: () => string } | string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  [key: string]: unknown;
}

export async function GET(request: NextRequest) {
  try {
    //Check for client availability.
    const client = await getTransactionsClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_TRANSACTIONS_DB || "transactions");

    const transactionsCollection = db.collection("transactions");

    // Read optional date-range parameters.
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    // Validate the date range when both dates are supplied.
    if (startDate && endDate && startDate > endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Start date cannot be later than end date.",
        },
        { status: 400 },
      );
    }

    // Filter MongoDB query based on the transaction.
    const filter =
      startDate || endDate
        ? {
            date: {
              ...(startDate ? { $gte: startDate } : {}),
              ...(endDate ? { $lte: endDate } : {}),
            },
          }
        : {};

    const transactions = await transactionsCollection
      .find(filter)
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
      .sort({ date: 1, transactionNumber: 1 })
      .toArray();

    // Serialize ObjectId to string so JSON can be sent to the client.
    const serialized = transactions.map((p: TransactionDocument) => ({
      ...p,
      _id: p._id?.toString?.() ?? p._id,
      createdAt:
        p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,

      updatedAt:
        p.updatedAt instanceof Date ? p.updatedAt.toISOString() : p.updatedAt,
    }));

    return NextResponse.json(
      {
        success: true,
        transactions: serialized,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch transactions:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch transactions",
      },
      { status: 500 },
    );
  }
}

// POST - add a transaction to the database.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const client = await getTransactionsClient();

    if (!client) {
      throw new Error("Transactions database client could not be initialized.");
    }

    const db = client.db(env.MONGODB_TRANSACTIONS_DB || "transactions");

    const transactionsCollection = db.collection("transactions");

    await transactionsCollection.createIndex(
      { transactionNumber: 1 },
      { unique: true },
    );

    const pricedRows = await priceTransactionRows(body?.rows);

    if ("error" in pricedRows) {
      return NextResponse.json(
        { success: false, message: pricedRows.error },
        { status: 400 },
      );
    }

    const normalizedRows = pricedRows.rows;

    // Body normalization and validation.
    const transactionNumber = await generateTransactionNumber(db);

    const calculatedTotal = normalizedRows.reduce(
      (sum: number, row: AdminTransactionRow) => sum + row.qty * row.price,
      0,
    );

    const normalizedBody = {
      ...body,
      customerCode: String(body?.customerCode ?? "").trim(),
      rows: normalizedRows,
      total: calculatedTotal,
      transactionNumber,
    };

    // Validate the transaction against the new schema.
    const validationResult = TransactionSchema.safeParse(normalizedBody);

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

    const transaction = validationResult.data;

    // Check what URI/DB is running.
    try {
      console.log(
        "MONGODB_TRANSACTIONS_URI present?",
        Boolean(env.MONGODB_TRANSACTIONS_URI),
      );
      console.log(
        "MONGODB_TRANSACTIONS_DB=",
        env.MONGODB_TRANSACTIONS_DB || "transactions",
      );
    } catch (e) {
      console.error("Failed to log env vars for Transactions MongoDB", e);
    }

    const transactionDocument = {
      transactionNumber: transaction.transactionNumber,
      transactionType: transaction.transactionType,
      customerCode: transaction.customerCode,
      date: transaction.date,
      rows: transaction.rows,
      total: transaction.total,
      createdAt: new Date(),
    };

    const insertedTransaction =
      await transactionsCollection.insertOne(transactionDocument);

    // Debug: Check where data is written.
    try {
      console.log(
        "Inserted into DB:",
        db.databaseName,
        "collection: transactions, id:",
        insertedTransaction.insertedId.toString(),
      );
    } catch (e) {
      console.error("Failed to log insert info", e);
    }

    return NextResponse.json(
      {
        success: true,
        message: "Transaction created successfully",
        insertedId: insertedTransaction.insertedId.toString(),
        transactionNumber: transaction.transactionNumber,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Transaction submission failed:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction number already exists. Please try again.",
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
            : "Something went wrong while saving the transaction",
      },
      { status: 500 },
    );
  }
}

// Update a transaction in the database.
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();

    const rawTransactionNumber =
      formData.get("transaction-number")?.toString().trim() ?? "";
    const rawTransactionData =
      formData.get("transactions-data")?.toString().trim() ?? "";

    if (!rawTransactionNumber || !rawTransactionData) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction Number and transaction data are required.",
        },
        { status: 400 },
      );
    }

    let transactionsData: unknown;

    try {
      transactionsData = JSON.parse(rawTransactionData);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid transaction data.",
        },
        { status: 400 },
      );
    }

    if (
      !transactionsData ||
      typeof transactionsData !== "object" ||
      Array.isArray(transactionsData)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid transaction data.",
        },
        { status: 400 },
      );
    }

    // Client check.
    const client = await getTransactionsClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_TRANSACTIONS_DB || "transactions");
    const transactionsCollection = db.collection("transactions");

    // Make sure the transaction being edited actually exists.
    const existingTransaction = await transactionsCollection.findOne({
      transactionNumber: rawTransactionNumber,
    });

    if (!existingTransaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found.",
        },
        { status: 404 },
      );
    }

    const transactionData = transactionsData as Record<string, unknown>;

    // Transaction Type cannot be changed after creation.
    if (
      transactionData.transactionType !== existingTransaction.transactionType
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction Type cannot be changed.",
        },
        { status: 400 },
      );
    }

    // Transaction Number cannot be changed after creation.
    if (
      transactionData.transactionNumber !==
      existingTransaction.transactionNumber
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction Number cannot be changed.",
        },
        { status: 400 },
      );
    }

    const pricedRows = await priceTransactionRows(transactionData.rows);

    if ("error" in pricedRows) {
      return NextResponse.json(
        {
          success: false,
          message: pricedRows.error,
        },
        { status: 400 },
      );
    }

    const validationResult = TransactionSchema.safeParse({
      ...transactionData,

      // Keep these values tied to the original transaction.
      transactionNumber: existingTransaction.transactionNumber,
      transactionType: existingTransaction.transactionType,

      rows: pricedRows.rows,
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

    const transaction = validationResult.data;

    // Check for duplicate transaction number.
    const duplicateTransaction = await transactionsCollection.findOne({
      transactionNumber: transaction.transactionNumber,
      _id: { $ne: existingTransaction._id },
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

    const calculatedTotal = transaction.rows.reduce(
      (sum: number, row: AdminTransactionRow) => sum + row.qty * row.price,
      0,
    );

    // Update the transaction.
    const updatedTransactionsData = {
      transactionNumber: existingTransaction.transactionNumber,
      transactionType: existingTransaction.transactionType,
      customerCode: transaction.customerCode,
      date: transaction.date,
      rows: transaction.rows,
      total: calculatedTotal,
      updatedAt: new Date(),
    };

    const updatedTransaction = await transactionsCollection.updateOne(
      { transactionNumber: rawTransactionNumber },
      {
        $set: updatedTransactionsData,
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: "Transaction updated successfully",
        modifiedCount: updatedTransaction.modifiedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Transaction update failed:", error);

    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === 11000
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "This transaction number already exists.",
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
            : "Something went wrong while updating the transaction",
      },
      { status: 500 },
    );
  }
}

//Delete a transaction in the database.
export async function DELETE(request: NextRequest) {
  try {
    //Find the form data from the request.
    const formData = await request.formData();

    const rawTransactionNumber =
      formData.get("transaction-number")?.toString().trim() ?? "";

    //Transaction Validation
    if (!rawTransactionNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction Number is required.",
        },
        { status: 400 },
      );
    }

    //Is the client there?
    const client = await getTransactionsClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_TRANSACTIONS_DB || "transactions");
    const transactionsCollection = db.collection("transactions");

    //Delete the transaction.
    const deletedTransaction = await transactionsCollection.deleteOne({
      transactionNumber: rawTransactionNumber,
    });

    if (deletedTransaction.deletedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Transaction deleted successfully",
        deletedCount: deletedTransaction.deletedCount,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Transaction deletion failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while deleting the transaction",
      },
      { status: 500 },
    );
  }
}
