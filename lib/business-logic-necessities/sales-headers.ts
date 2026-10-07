import { env } from "@/lib/env";
import { getSalesClient, getTransactionsClient } from "@/lib/mongodb";

export type CurrentSalesHeader = {
  _id: string;
  transactionId: string;
  transactionNumber: string;
  customerCode: string;
  date: string;
  rows: {
    id: string;
    productId: string;
    productName: string;
    qty: number;
    price: number;
  }[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
};

function serializeDate(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  return String(value ?? "");
}

function serializeTimestamp(value: unknown): string | undefined {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return typeof value === "string" ? value : undefined;
}

async function resolveSalesHeaders(salesRecords: Record<string, unknown>[]) {
  if (salesRecords.length === 0) {
    return [];
  }

  const transactionNumbers = salesRecords
    .map((sale) => String(sale.transactionNumber ?? "").trim())
    .filter(Boolean);

  const transactionsClient = await getTransactionsClient();
  const transactionsDb = transactionsClient.db(
    env.MONGODB_TRANSACTIONS_DB || "transactions",
  );
  const transactions = await transactionsDb
    .collection("transactions")
    .find({ transactionNumber: { $in: transactionNumbers } })
    .project({
      _id: 1,
      transactionNumber: 1,
      transactionType: 1,
      customerCode: 1,
      date: 1,
      rows: 1,
      total: 1,
    })
    .toArray();

  const transactionsByNumber = new Map(
    transactions.map((transaction) => [
      transaction.transactionNumber,
      transaction,
    ]),
  );

  return salesRecords.flatMap((sale) => {
    const transactionNumber = String(sale.transactionNumber ?? "").trim();
    const transaction = transactionsByNumber.get(transactionNumber);

    if (!transaction || transaction.transactionType !== "SALES") {
      return [];
    }

    const rows = Array.isArray(transaction.rows)
      ? transaction.rows.map((row: Record<string, unknown>) => ({
          id: String(row.id ?? ""),
          productId: String(row.productId ?? ""),
          productName: String(row.productName ?? ""),
          qty: typeof row.qty === "number" ? row.qty : Number(row.qty) || 0,
          price:
            typeof row.price === "number" ? row.price : Number(row.price) || 0,
        }))
      : [];

    return [
      {
        _id:
          typeof sale._id === "object" &&
          sale._id !== null &&
          "toString" in sale._id &&
          typeof sale._id.toString === "function"
            ? sale._id.toString()
            : String(sale._id ?? ""),
        transactionId:
          String(sale.transactionId ?? "") || String(transaction._id ?? ""),
        transactionNumber,
        customerCode: String(transaction.customerCode ?? ""),
        date: serializeDate(transaction.date),
        rows,
        total:
          typeof transaction.total === "number"
            ? transaction.total
            : Number(transaction.total) || 0,
        createdAt: serializeTimestamp(sale.createdAt),
        updatedAt: serializeTimestamp(sale.updatedAt),
      },
    ];
  });
}

export async function getCurrentSalesHeaders(): Promise<CurrentSalesHeader[]> {
  const salesClient = await getSalesClient();
  const salesDb = salesClient.db(env.MONGODB_SALES_DB || "sales");
  const salesRecords = await salesDb.collection("sales").find({}).toArray();

  return resolveSalesHeaders(salesRecords);
}

export async function getCurrentSalesHeaderByTransactionNumber(
  transactionNumber: string,
): Promise<CurrentSalesHeader | null> {
  const salesClient = await getSalesClient();
  const salesDb = salesClient.db(env.MONGODB_SALES_DB || "sales");
  const salesRecord = await salesDb.collection("sales").findOne({
    transactionNumber: transactionNumber.trim(),
  });

  if (!salesRecord) {
    return null;
  }

  const [salesHeader] = await resolveSalesHeaders([salesRecord]);
  return salesHeader ?? null;
}
