import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getLogsClient, getTransactionsClient } from "@/lib/mongodb";
import { LogSchema } from "@/lib/validators/logs";

export const runtime = "nodejs";

//GET- Retrieve a sales log.
export async function GET() {
  try {
    // Logs Client check.
    const logsClient = await getLogsClient();

    if (!logsClient) {
      throw new Error("Logs database client could not be initialized.");
    }

    const logsDb = logsClient.db(env.MONGODB_LOGS_DB || "logs");
    const logsCollection = logsDb.collection("logs");

    // Get the Sales Log references.
    const logs = await logsCollection
      .find({})
      .project({
        _id: 1,
        transactionNumber: 1,
        periodStart: 1,
        periodEnd: 1,
        salesRows: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({ periodStart: 1, periodEnd: 1 })
      .toArray();

    if (logs.length === 0) {
      return NextResponse.json(
        {
          success: true,
          logs: [],
        },
        { status: 200 },
      );
    }

    // Transactions database.
    const transactionsClient = await getTransactionsClient();

    if (!transactionsClient) {
      throw new Error("Transactions database client could not be initialized.");
    }

    const transactionsDb = transactionsClient.db(
      env.MONGODB_TRANSACTIONS_DB || "transactions",
    );

    const transactionsCollection = transactionsDb.collection("transactions");

    //Date normalization, to make sure this works regardless of whether the date is a string or a Date.
    const normalizeDate = (value: unknown): string => {
      if (!value) {
        return "";
      }

      if (value instanceof Date) {
        return value.toISOString().split("T")[0];
      }

      return String(value).split("T")[0];
    };

    //Aggregate transaction rows by Product ID.

    const aggregateRows = (
      sourceTransactions: Array<{
        rows?: Array<{
          id?: string;
          productId?: string;
          productName?: string;
          qty?: number;
          price?: number;
        }>;
      }>,
    ) => {
      const grouped = new Map<
        string,
        {
          productId: string;
          productName: string;
          qty: number;
          value: number;
        }
      >();

      for (const transaction of sourceTransactions) {
        if (!Array.isArray(transaction.rows)) {
          continue;
        }

        for (const row of transaction.rows) {
          const productId = String(row.productId ?? "").trim();

          if (!productId) {
            continue;
          }

          const qty = Number(row.qty ?? 0);
          const price = Number(row.price ?? 0);
          const value = qty * price;

          const existing = grouped.get(productId);

          if (existing) {
            existing.qty += qty;
            existing.value += value;

            if (!existing.productName && row.productName) {
              existing.productName = String(row.productName);
            }
          } else {
            grouped.set(productId, {
              productId,
              productName: String(row.productName ?? ""),
              qty,
              value,
            });
          }
        }
      }

      return Array.from(grouped.values()).map((row) => ({
        id: row.productId,
        productId: row.productId,
        productName: row.productName,
        qty: row.qty,
        price: row.qty > 0 ? row.value / row.qty : 0,
      }));
    };

    //* Calculate Ending Inventory:

    const calculateEndingRows = (
      beginningRows: Array<{
        id: string;
        productId: string;
        productName: string;
        qty: number;
        price: number;
      }>,
      additionRows: Array<{
        id: string;
        productId: string;
        productName: string;
        qty: number;
        price: number;
      }>,
      salesRows: Array<{
        id: string;
        productId: string;
        productName: string;
        qty: number;
        price: number;
      }>,
    ) => {
      const grouped = new Map<
        string,
        {
          productId: string;
          productName: string;
          availableQty: number;
          availableValue: number;
          endingQty: number;
        }
      >();

      // Beginning Inventory section of the Sales Log.
      for (const row of beginningRows) {
        const existing = grouped.get(row.productId);
        const rowValue = row.qty * row.price;

        if (existing) {
          existing.availableQty += row.qty;
          existing.availableValue += rowValue;
          existing.endingQty += row.qty;

          if (!existing.productName) {
            existing.productName = row.productName;
          }
        } else {
          grouped.set(row.productId, {
            productId: row.productId,
            productName: row.productName,
            availableQty: row.qty,
            availableValue: rowValue,
            endingQty: row.qty,
          });
        }
      }

      // Additions section of the Sales Log.
      for (const row of additionRows) {
        const existing = grouped.get(row.productId);
        const rowValue = row.qty * row.price;

        if (existing) {
          existing.availableQty += row.qty;
          existing.availableValue += rowValue;
          existing.endingQty += row.qty;

          if (!existing.productName) {
            existing.productName = row.productName;
          }
        } else {
          grouped.set(row.productId, {
            productId: row.productId,
            productName: row.productName,
            availableQty: row.qty,
            availableValue: rowValue,
            endingQty: row.qty,
          });
        }
      }

      // Sales reduce Ending Inventory.
      for (const row of salesRows) {
        const existing = grouped.get(row.productId);

        if (existing) {
          existing.endingQty -= row.qty;
        } else {
          // Keep the product visible even if sales exceed the currently available inventory.
          grouped.set(row.productId, {
            productId: row.productId,
            productName: row.productName,
            availableQty: 0,
            availableValue: 0,
            endingQty: -row.qty,
          });
        }
      }

      return Array.from(grouped.values()).map((row) => ({
        id: row.productId,
        productId: row.productId,
        productName: row.productName,
        qty: row.endingQty,
        price: row.availableQty > 0 ? row.availableValue / row.availableQty : 0,
      }));
    };

    // Load the Transactions saved.
    const transactions = await transactionsCollection
      .find({})
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

    //Base the current sales log on current inventory transactions.
    const serialized = logs.map((log) => {
      const periodStart = normalizeDate(log.periodStart);
      const periodEnd = normalizeDate(log.periodEnd);

      // Find Transactions currently belonging to this Log's period.
      const periodTransactions = transactions.filter((transaction) => {
        const transactionDate = normalizeDate(transaction.date);

        return transactionDate >= periodStart && transactionDate <= periodEnd;
      });

      // Segregate transactions.
      const beginningTransactions = periodTransactions.filter(
        (transaction) => transaction.transactionType === "BEGINNING_INVENTORY",
      );

      const additionTransactions = periodTransactions.filter(
        (transaction) => transaction.transactionType === "ADDITION",
      );

      // Recalculate the current rows.
      const beginningRows = aggregateRows(beginningTransactions);
      const additionRows = aggregateRows(additionTransactions);
      const salesRows = Array.isArray(log.salesRows) ? log.salesRows : [];

      // Recalculate Ending Inventory.
      const endingRows = calculateEndingRows(
        beginningRows,
        additionRows,
        salesRows,
      );

      return {
        // Keep the Sales Header's own database identity, as well as the transactionIds.
        _id: log._id?.toString?.() ?? String(log._id ?? ""),
        transactionNumber: log.transactionNumber ?? "",

        // Keep the saved reporting period.
        periodStart,
        periodEnd,

        // Use the CURRENT transaction values.
        beginningRows,
        additionRows,
        salesRows,
        endingRows,

        createdAt:
          log.createdAt instanceof Date
            ? log.createdAt.toISOString()
            : log.createdAt,

        updatedAt:
          log.updatedAt instanceof Date
            ? log.updatedAt.toISOString()
            : log.updatedAt,
      };
    });

    return NextResponse.json(
      {
        success: true,
        logs: serialized,
      },
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

    const client = await getLogsClient();
    if (!client) {
      throw new Error("Database client is null. Connection failed.");
    }

    const db = client.db(env.MONGODB_LOGS_DB || "logs");
    const logsCollection = db.collection("logs");

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

    // Check what URI/DB is running.
    try {
      console.log("MONGODB_LOGS_URI=", env.MONGODB_LOGS_URI);
      console.log("MONGODB_LOGS_DB=", env.MONGODB_LOGS_DB);
    } catch (e) {
      console.error("Failed to log env vars for MongoDB", e);
    }

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
    console.error("Log submission failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Something went wrong while saving the log",
      },
      { status: 500 },
    );
  }
}
