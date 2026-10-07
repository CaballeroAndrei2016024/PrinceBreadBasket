import type { Db } from "mongodb";

//Generate Customer Codes.
export async function generateCustomerCode(db: Db): Promise<string> {
  const customers = db.collection("customers");
  const existingCustomers = await customers
    .find({ customerCode: { $regex: /^C\d+$/i } })
    .project<{ customerCode?: string }>({ customerCode: 1 })
    .toArray();

  const highestExistingNumber = existingCustomers.reduce(
    (highest, customer) => {
      const match = /^C(\d+)$/i.exec(customer.customerCode ?? "");
      return match ? Math.max(highest, Number(match[1])) : highest;
    },
    0,
  );

  const counters = db.collection<{ _id: string; sequence: number }>("counters");

  try {
    await counters.updateOne(
      { _id: "customer-code" },
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
    { _id: "customer-code" },
    { $inc: { sequence: 1 } },
    { returnDocument: "after", includeResultMetadata: false },
  );

  if (!counter) {
    throw new Error("Could not generate a customer code.");
  }

  return `C${String(counter.sequence).padStart(3, "0")}`;
}
