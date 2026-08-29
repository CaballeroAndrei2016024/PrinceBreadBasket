"use client";
//Component Logic for Total Available for Sale and Sales.
import React from "react";
import type { InventoryRow, ProductOption } from "./inventory.types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

type InventorySummaryProps = {
  products: ProductOption[];

  beginningRows: InventoryRow[];
  additionRows: InventoryRow[];
  endingRows: InventoryRow[];
};

const InventorySummary = ({
  products,
  beginningRows,
  additionRows,
  endingRows,
}: InventorySummaryProps) => {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  // A + B
  const grouped = new Map<
    string,
    {
      productId: string;
      productName: string;
      price: number;
      qty: number;
    }
  >();

  for (const row of [...beginningRows, ...additionRows]) {
    if (!row.productId) continue;

    const product = products.find((p) => p.productId === row.productId);

    const productName = product?.productName ?? "";

    const key = `${row.productId}-${row.price}`;

    if (grouped.has(key)) {
      grouped.get(key)!.qty += row.qty;
    } else {
      grouped.set(key, {
        productId: row.productId,
        productName,
        price: row.price,
        qty: row.qty,
      });
    }
  }

  const totalAvailable = Array.from(grouped.values());

  const totalAvailableGrandTotal = totalAvailable.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  //
  // (A+B)-C
  //
  const sales = totalAvailable.map((row) => {
    const endingQty = endingRows
      .filter((r) => r.productId === row.productId && r.price === row.price)
      .reduce((sum, r) => sum + r.qty, 0);

    return {
      ...row,
      qty: row.qty - endingQty,
    };
  });

  const salesGrandTotal = sales.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  return (
    <>
      {/* Total Available for Sale*/}

      <div className="mt-4 rounded-lg border border-prince-yellow bg-prince-yellow/20 p-4">
        <h1
          className="font-bold text-2xl text-prince-red"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Total Available for Sale
        </h1>

        <div className="mt-4 space-y-2">
          {totalAvailable.map((row) => (
            <div
              key={`${row.productId}-${row.price}`}
              className="flex flex-col md:flex-row gap-2"
            >
              <input
                readOnly
                value={row.productId}
                className="w-full md:w-1/4 rounded border px-2 py-1 bg-gray-100"
              />

              <input
                readOnly
                value={row.productName}
                className="w-full md:w-1/4 rounded border px-2 py-1 bg-gray-100"
              />

              <input
                readOnly
                value={row.qty}
                className="w-full md:w-1/4 rounded border px-2 py-1 bg-gray-100"
              />

              <div className="flex items-center gap-1">
                <input
                  readOnly
                  value={row.price.toFixed(2)}
                  className="w-full md:w-1/5 rounded border px-2 py-1 bg-gray-100"
                />

                <span className="text-xs font-semibold text-slate-600">
                  {currency}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <input
                  readOnly
                  value={(row.qty * row.price).toFixed(2)}
                  className="w-full md:w-1/5 rounded border px-2 py-1 bg-gray-100"
                />
                <span className="text-xs font-semibold text-slate-600">
                  {currency}
                </span>
              </div>
            </div>
          ))}
          <div className="mt-4 flex justify-end items-center gap-3">
            <span className="font-bold text-prince-red">Grand Total:</span>

            <div className="w-40">
              <input
                readOnly
                value={totalAvailableGrandTotal.toFixed(2)}
                className="w-full rounded border border-prince-yellow bg-prince-green/20 px-2 py-1 font-bold text-right"
              />
              <span className="text-xs font-semibold text-slate-600">
                {currency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ending Inventory */}

      <div className="mt-4 rounded-lg border border-prince-yellow bg-prince-yellow/20 p-4">
        <h1
          className="font-bold text-2xl text-prince-red"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          Ending Inventory
        </h1>

        <div className="mt-4 space-y-2">
          {sales.map((row) => {
            const key = `${row.productId}-${row.price}`;
            const sellingPrice = row.price;
            return (
              <div
                key={`${row.productId}-${row.price}`}
                className="flex flex-col md:flex-row gap-2"
              >
                <input
                  readOnly
                  value={row.productId}
                  className="w-full md:w-1/5 rounded border px-2 py-1 bg-gray-100"
                />

                <input
                  readOnly
                  value={row.productName}
                  className="w-full md:w-1/5 rounded border px-2 py-1 bg-gray-100"
                />

                <input
                  readOnly
                  value={row.qty}
                  className="w-full md:w-1/5 rounded border px-2 py-1 bg-gray-100"
                />
                <div className="flex items-center gap-1">
                  <input
                    readOnly
                    value={sellingPrice.toFixed(2)}
                    className="w-full md:w-1/5 rounded border px-2 py-1 bg-gray-100"
                  />

                  <span className="text-xs font-semibold text-slate-600">
                    {currency}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    readOnly
                    value={(sellingPrice * row.qty).toFixed(2)}
                    className="w-full md:w-1/5 rounded border px-2 py-1 bg-gray-100"
                  />
                  <span className="text-xs font-semibold text-slate-600">
                    {currency}
                  </span>
                </div>
              </div>
            );
          })}
          <div className="mt-4 flex justify-end items-center gap-3">
            <span className="font-bold text-prince-red">Grand Total:</span>

            <div className="w-40">
              <input
                readOnly
                value={salesGrandTotal.toFixed(2)}
                className="w-full rounded border border-prince-yellow bg-prince-green/20 px-2 py-1 font-bold text-right"
              />

              <span className="text-xs font-semibold text-slate-600">
                {currency}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InventorySummary;
