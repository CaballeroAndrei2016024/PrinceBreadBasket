import type { Db } from "mongodb";

//Generate Transaction Numbers.
export async function generateTransactionNumber(db: Db): Promise<string> {
  const transactions = db.collection("transactions");
  const existingTransactions = await transactions
    .find({ transactionNumber: { $regex: /^T\d+$/i } })
    .project<{ transactionNumber?: string }>({ transactionNumber: 1 })
    .toArray();

  const highestExistingNumber = existingTransactions.reduce(
    (highest, transaction) => {
      const match = /^T(\d+)$/i.exec(transaction.transactionNumber ?? "");
      return match ? Math.max(highest, Number(match[1])) : highest;
    },
    0,
  );

  const counters = db.collection<{ _id: string; sequence: number }>("counters");

  try {
    await counters.updateOne(
      { _id: "transaction-number" },
      { $max: { sequence: highestExistingNumber } },
      { upsert: true },
    );
  } catch (error) {
    if (
      !error ||
      typeof error !== "object" ||
      !("code" in error) ||
      error.code !== 11000
    ) {
      throw error;
    }
  }

  const counter = await counters.findOneAndUpdate(
    { _id: "transaction-number" },
    { $inc: { sequence: 1 } },
    { returnDocument: "after", includeResultMetadata: false },
  );

  if (!counter) {
    throw new Error("Could not generate a transaction number.");
  }

  return `T${String(counter.sequence).padStart(4, "0")}`;
}
