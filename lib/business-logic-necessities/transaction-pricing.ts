import { env } from "@/lib/env";
import { getProductClient } from "@/lib/mongodb";

//This is the part where transactions prices are fixed.
export type PricedTransactionRow = {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  price: number;
};

export async function priceTransactionRows(
  rows: unknown,
): Promise<{ rows: PricedTransactionRow[] } | { error: string }> {
  if (!Array.isArray(rows)) {
    return { error: "Transaction rows must be an array." };
  }

  const inputRows = rows.map((row) =>
    row && typeof row === "object" ? (row as Record<string, unknown>) : {},
  );
  const productIds = Array.from(
    new Set(
      inputRows
        .map((row) => String(row.productId ?? "").trim())
        .filter(Boolean),
    ),
  );

  const productClient = await getProductClient();
  const products = await productClient
    .db(env.MONGODB_PRODUCTS_DB || "products")
    .collection("products")
    .find({ productId: { $in: productIds } })
    .project({ productId: 1, productName: 1, productPrice: 1 })
    .toArray();
  const productsById = new Map(
    products.map((product) => [String(product.productId), product]),
  );

  const pricedRows: PricedTransactionRow[] = [];

  for (const row of inputRows) {
    const productId = String(row.productId ?? "").trim();
    const product = productsById.get(productId);

    if (productId && !product) {
      return { error: `Product ${productId} was not found.` };
    }

    pricedRows.push({
      id: String(row.id ?? ""),
      productId,
      productName: product ? String(product.productName ?? "") : "",
      qty: Number(row.qty ?? 0),
      price: product ? Number(product.productPrice) : 0,
    });
  }

  return { rows: pricedRows };
}
