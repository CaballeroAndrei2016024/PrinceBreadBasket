"use client";
//Component Logic for Beginning Inventory, Additions, and Ending Inventory.
import React from "react";
import type { TransactionRow } from "@/app/(princebread)/types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

type LogsInventorySectionProps = {
  title: string;
  rows: TransactionRow[];
  editable?: boolean;
  onQuantityChange?: (rowId: string, qty: number) => void;
};

const LogsInventorySection = ({
  title,
  rows,
  editable = false,
  onQuantityChange,
}: LogsInventorySectionProps) => {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  const grandTotal = rows.reduce((sum, row) => sum + row.qty * row.price, 0);
  return (
    <div className="mt-4 w-full rounded-lg border border-prince-yellow bg-prince-yellow/20 p-4">
      <h1
        className="font-bold text-2xl text-prince-red text-shadow-sm"
        style={{
          fontFamily: "var(--font-heading)",
        }}
      >
        {title}
      </h1>

      {/*Read-only Inventorysection.*/}
      <div
        className="mt-4 space-y-3 overflow-x-auto"
        style={{
          fontFamily: "var(--font-body)",
        }}
      >
        <table className="w-full min-w-[40rem] border-collapse text-sm">
          <thead>
            <tr className="bg-prince-green text-white">
              <th className="border border-prince-yellow p-2 text-left">
                Product ID
              </th>
              <th className="border border-prince-yellow p-2 text-left">
                Product Name
              </th>
              <th className="border border-prince-yellow p-2 text-center">
                Qty
              </th>
              <th className="border border-prince-yellow p-2 text-center whitespace-nowrap">
                Unit Price ({currency})
              </th>
              <th className="border border-prince-yellow p-2 text-center whitespace-nowrap">
                Total ({currency})
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-prince-yellow/10">
                  <td className="border border-prince-yellow p-2">
                    {row.productId}
                  </td>

                  <td className="border border-prince-yellow p-2">
                    {row.productName}
                  </td>

                  <td className="border border-prince-yellow p-2 text-center">
                    {editable ? (
                      <input
                        type="number"
                        min={0}
                        value={row.qty}
                        onChange={(e) =>
                          onQuantityChange?.(
                            row.id,
                            Number(e.target.value) || 0,
                          )
                        }
                        className="w-full rounded-md border border-gray-300 bg-white p-1 text-center text-slate-700 focus:border-prince-green focus:outline-none"
                      />
                    ) : (
                      row.qty
                    )}
                  </td>

                  <td className="border border-prince-yellow p-2 text-center whitespace-nowrap">
                    {row.price.toFixed(2)} {currency}
                  </td>

                  <td className="border border-prince-yellow p-2 text-center font-semibold whitespace-nowrap">
                    {(row.qty * row.price).toFixed(2)} {currency}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="border border-prince-yellow p-4 text-center text-slate-500"
                >
                  No transactions found for this period.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Grand Total */}
        <div className="mt-4 flex justify-end">
          <div className="w-full md:w-1/4">
            <label className="mb-1 block text-right font-bold">
              Grand Total
            </label>

            <input
              readOnly
              value={grandTotal.toFixed(2)}
              className="w-full rounded-md border border-prince-yellow bg-prince-green/20 px-2 py-2 text-right font-bold"
            />

            <span className="text-xs font-semibold text-slate-600">
              {currency}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsInventorySection;
