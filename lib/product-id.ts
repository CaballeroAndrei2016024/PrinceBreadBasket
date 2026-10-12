import type { Db } from "mongodb";

//Generate Product ID.
export async function generateProductId(db: Db): Promise<string> {
  const products = db.collection("products");
  const existingProducts = await products
    .find({ productId: { $regex: /^P\d+$/i } })
    .project<{ productId?: string }>({ productId: 1 })
    .toArray();

  const highestExistingNumber = existingProducts.reduce((highest, product) => {
    const match = /^P(\d+)$/i.exec(product.productId ?? "");
    return match ? Math.max(highest, Number(match[1])) : highest;
  }, 0);

  const counters = db.collection<{ _id: string; sequence: number }>("counters");

  try {
    await counters.updateOne(
      { _id: "product-id" },
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
    { _id: "product-id" },
    { $inc: { sequence: 1 } },
    { returnDocument: "after", includeResultMetadata: false },
  );

  if (!counter) {
    throw new Error("Could not generate a product ID.");
  }

  return `P${String(counter.sequence).padStart(4, "0")}`;
}
