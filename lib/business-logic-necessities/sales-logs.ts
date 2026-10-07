import { env } from "@/lib/env";
import { getLogsClient, getTransactionsClient } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type SourceRow = {
  id?: string;
  productId?: string;
  productName?: string;
  qty?: number;
  price?: number;
};

type SourceTransaction = {
  transactionType?: string;
  date?: string | Date;
  rows?: SourceRow[];
};

type SalesLogRecord = {
  _id?: { toString?: () => string } | string;
  transactionNumber?: string;
  periodStart?: string | Date;
  periodEnd?: string | Date;
  salesRows?: SalesLogRow[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
};

export type CurrentSalesLog = {
  _id?: string;
  transactionNumber: string;
  periodStart: string;
  periodEnd: string;
  beginningRows: SalesLogRow[];
  additionRows: SalesLogRow[];
  salesRows: SalesLogRow[];
  endingRows: SalesLogRow[];
  createdAt?: string;
  updatedAt?: string;
};

type SalesLogRow = {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  price: number;
};

function normalizeDate(value: string | Date | undefined): string {
  if (!value) {
    return "";
  }

  return value instanceof Date
    ? value.toISOString().split("T")[0]
    : value.split("T")[0];
}

function serializeTimestamp(value: string | Date | undefined) {
  return value instanceof Date ? value.toISOString() : value;
}

function aggregateRows(transactions: SourceTransaction[]): SalesLogRow[] {
  const grouped = new Map<
    string,
    { productName: string; qty: number; value: number }
  >();

  for (const transaction of transactions) {
    for (const row of transaction.rows ?? []) {
      const productId = String(row.productId ?? "").trim();
      if (!productId) continue;

      const qty = Number(row.qty ?? 0);
      const price = Number(row.price ?? 0);
      const current = grouped.get(productId);

      if (current) {
        current.qty += qty;
        current.value += qty * price;
        if (!current.productName && row.productName) {
          current.productName = row.productName;
        }
      } else {
        grouped.set(productId, {
          productName: row.productName ?? "",
          qty,
          value: qty * price,
        });
      }
    }
  }

  return Array.from(grouped, ([productId, row]) => ({
    id: productId,
    productId,
    productName: row.productName,
    qty: row.qty,
    price: row.qty > 0 ? row.value / row.qty : 0,
  }));
}

function calculateEndingRows(
  beginningRows: SalesLogRow[],
  additionRows: SalesLogRow[],
  salesRows: SalesLogRow[],
): SalesLogRow[] {
  const available = new Map<
    string,
    { productName: string; qty: number; value: number }
  >();

  for (const row of [...beginningRows, ...additionRows]) {
    const current = available.get(row.productId);
    const value = row.qty * row.price;

    if (current) {
      current.qty += row.qty;
      current.value += value;
    } else {
      available.set(row.productId, {
        productName: row.productName,
        qty: row.qty,
        value,
      });
    }
  }

  const sold = new Map(salesRows.map((row) => [row.productId, row]));
  const productIds = new Set([...available.keys(), ...sold.keys()]);

  return Array.from(productIds, (productId) => {
    const availableRow = available.get(productId);
    const soldRow = sold.get(productId);

    return {
      id: productId,
      productId,
      productName: availableRow?.productName ?? soldRow?.productName ?? "",
      qty: (availableRow?.qty ?? 0) - (soldRow?.qty ?? 0),
      price:
        availableRow && availableRow.qty > 0
          ? availableRow.value / availableRow.qty
          : 0,
    };
  });
}

function resolveLog(
  log: SalesLogRecord,
  transactions: SourceTransaction[],
): CurrentSalesLog {
  const periodStart = normalizeDate(log.periodStart);
  const periodEnd = normalizeDate(log.periodEnd);
  const inPeriod = (date: string) => date >= periodStart && date <= periodEnd;

  const periodTransactions = transactions.filter((transaction) =>
    inPeriod(normalizeDate(transaction.date)),
  );
  const beginningRows = aggregateRows(
    periodTransactions.filter(
      (transaction) => transaction.transactionType === "BEGINNING_INVENTORY",
    ),
  );
  const additionRows = aggregateRows(
    periodTransactions.filter(
      (transaction) => transaction.transactionType === "ADDITION",
    ),
  );
  const salesRows = Array.isArray(log.salesRows) ? log.salesRows : [];
  const endingRows = calculateEndingRows(
    beginningRows,
    additionRows,
    salesRows,
  );

  return {
    _id: typeof log._id === "string" ? log._id : log._id?.toString?.(),
    transactionNumber: log.transactionNumber ?? "",
    periodStart,
    periodEnd,
    beginningRows,
    additionRows,
    salesRows,
    endingRows,
    createdAt: serializeTimestamp(log.createdAt),
    updatedAt: serializeTimestamp(log.updatedAt),
  };
}

async function loadSources() {
  const transactionsClient = await getTransactionsClient();
  const transactionsDb = transactionsClient.db(
    env.MONGODB_TRANSACTIONS_DB || "transactions",
  );
  const transactions = (await transactionsDb
    .collection("transactions")
    .find({})
    .project({ transactionType: 1, date: 1, rows: 1 })
    .toArray()) as SourceTransaction[];

  return { transactions };
}

export async function getCurrentSalesLogs(): Promise<CurrentSalesLog[]> {
  const logsClient = await getLogsClient();
  const logsDb = logsClient.db(env.MONGODB_LOGS_DB || "logs");
  const logs = (await logsDb
    .collection("logs")
    .find({})
    .sort({ periodStart: 1, periodEnd: 1 })
    .toArray()) as SalesLogRecord[];

  if (logs.length === 0) {
    return [];
  }

  const { transactions } = await loadSources();
  return logs.map((log) => resolveLog(log, transactions));
}

export async function getCurrentSalesLogById(
  id: string,
): Promise<CurrentSalesLog | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }

  const logsClient = await getLogsClient();
  const logsDb = logsClient.db(env.MONGODB_LOGS_DB || "logs");
  const log = (await logsDb.collection("logs").findOne({
    _id: new ObjectId(id),
  })) as SalesLogRecord | null;

  if (!log) {
    return null;
  }

  const { transactions } = await loadSources();
  return resolveLog(log, transactions);
}
