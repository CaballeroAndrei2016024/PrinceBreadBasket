import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";
import { env } from "@/lib/env";
import { getTransactionsClient } from "@/lib/mongodb";
import type { AdminTransaction } from "@/app/admin/types";
import AdminTransactionsList from "../components/transactionslist";

export const revalidate = 5; //5 second revalidation.

async function getTransactions(): Promise<AdminTransaction[]> {
  const client = await getTransactionsClient();
  // Client check.
  if (!client) {
    throw new Error("Database client is null. Connection failed.");
  }
  const db = client.db(env.MONGODB_TRANSACTIONS_DB || "transactions");
  const transactionsCollection = db.collection("transactions");

  const transactions = await transactionsCollection.find().toArray();

  return transactions
    .filter(
      (transaction) =>
        transaction.transactionType === "BEGINNING_INVENTORY" ||
        transaction.transactionType === "ADDITION" ||
        transaction.transactionType === "SALES",
    )
    .map((transaction) => ({
      ...transaction,
      _id: transaction._id?.toString?.() ?? transaction._id,
      transactionNumber: transaction.transactionNumber ?? "",
      date: transaction.date ?? "",
      customerCode: transaction.customerCode ?? "",
      rows: Array.isArray(transaction.rows)
        ? transaction.rows.map((row) => ({
            id: String(row?.id ?? ""),
            productId: String(row?.productId ?? "").trim(),
            productName: String(row?.productName ?? "").trim(),
            qty: Number(row?.qty ?? 0),
            price: Number(row?.price ?? 0),
          }))
        : [],
      total: typeof transaction.total === "number" ? transaction.total : 0,
      createdAt:
        transaction.createdAt instanceof Date
          ? transaction.createdAt.toISOString()
          : typeof transaction.createdAt === "string"
            ? transaction.createdAt
            : undefined,
    })) as AdminTransaction[];
}

export const metadata = {
  title: "Here is the page for your Transactions",
  description:
    "This is the page where you can see your company's transactions.",
};

export default async function AdminTransactionsPage() {
  const transactions = await getTransactions();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg">
        <h1
          className="text-2xl font-bold text-prince-yellow"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Transactions
        </h1>
        <p
          className="mt-2 text-sm text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          Displaying List of Transactions:
        </p>

        <AdminTransactionsList transactions={transactions} />
      </div>
    </div>
  );
}
