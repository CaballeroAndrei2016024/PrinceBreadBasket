import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getTransactionsClient } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ transactionNumber: string }> },
) {
  try {
    const { transactionNumber } = await params;
    const normalizedTransactionNumber = transactionNumber.trim();

    if (!normalizedTransactionNumber) {
      return NextResponse.json(
        {
          success: false,
          message: "TransactionNumber is required",
        },
        { status: 400 },
      );
    }

    const client = await getTransactionsClient();

    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_TRANSACTIONS_DB || "transactions");
    const transactionsCollection = db.collection("transactions");

    const transaction = await transactionsCollection.findOne({
      transactionNumber: normalizedTransactionNumber,
    });

    if (!transaction) {
      return NextResponse.json(
        {
          success: false,
          message: "Transaction not found",
        },
        { status: 404 },
      );
    }

    const serializedTransaction = {
      ...transaction,

      _id: transaction._id.toString(),

      date:
        transaction.date instanceof Date
          ? transaction.date.toISOString().split("T")[0]
          : transaction.date,

      createdAt:
        transaction.createdAt instanceof Date
          ? transaction.createdAt.toISOString()
          : transaction.createdAt,

      updatedAt:
        transaction.updatedAt instanceof Date
          ? transaction.updatedAt.toISOString()
          : transaction.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        transaction: serializedTransaction,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Failed to fetch Transaction:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch Transaction",
      },
      { status: 500 },
    );
  }
}
