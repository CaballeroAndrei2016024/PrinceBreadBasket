import { notFound } from "next/navigation";
import AdminTransactionDetails from "../components/transactiondetails";
import { env } from "@/lib/env";
import { getTransactionsClient } from "@/lib/mongodb";
import type {
  AdminTransactionRow,
  AdminTransactionType,
} from "@/app/admin/types";

type PageProps = {
  params: Promise<{
    transactionNumber: string;
  }>;
};

//The transaction info as shown by the admin module.
type TransactionRecord = {
  _id?: string;
  transactionNumber: string;
  transactionType: AdminTransactionType;
  customerCode: string;
  date: string | Date;
  rows: AdminTransactionRow[];
  total: number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

//To serialize Dates.
function serializeDate(value: string | Date | undefined): string {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  return value.toISOString();
}

//Find a Transaction by its transactionNumber.
async function getTransactionByTransactionNumber(transactionNumber: string) {
  //Client check.
  const client = await getTransactionsClient();
  if (!client) {
    throw new Error("Database client is null. Connection failed.");
  }

  const db = client.db(env.MONGODB_TRANSACTIONS_DB || "transactions");
  const transaction = (await db
    .collection("transactions")
    .findOne({ transactionNumber })) as TransactionRecord | null;

  if (!transaction) {
    return null;
  }

  //Find the page indicated by the transaction variables.
  return {
    ...transaction,
    _id:
      transaction._id !== undefined && transaction._id !== null
        ? String(transaction._id)
        : undefined,

    transactionNumber: transaction.transactionNumber ?? "",
    transactionType: transaction.transactionType,
    customerCode: transaction.customerCode ?? "",

    date: serializeDate(transaction.date),

    rows: transaction.rows ?? [],

    total: transaction.total,

    createdAt: serializeDate(transaction.createdAt),
    updatedAt: serializeDate(transaction.updatedAt),
  };
}

export default async function TransactionPage({ params }: PageProps) {
  const { transactionNumber } = await params;
  const transaction = await getTransactionByTransactionNumber(
    transactionNumber.trim(),
  );

  if (!transaction) {
    notFound();
  }

  return <AdminTransactionDetails transaction={transaction} />;
}
