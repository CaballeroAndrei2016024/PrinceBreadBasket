"use client";
//Component Logic for Total Available for Sale and Sales.
import React from "react";
import { useSyncExternalStore } from "react";
import type { AdminTransactionRow } from "@/app/admin/types";
import { getSettings, subscribeSettings } from "@/lib/settings";

type InventorySummaryProps = {
  beginningRows: AdminTransactionRow[];
  additionRows: AdminTransactionRow[];
  salesRows: AdminTransactionRow[];
  endingRows: AdminTransactionRow[];
};

const getQuantity = (rows: AdminTransactionRow[]) => {
  return rows.reduce((sum, row) => sum + row.qty, 0);
};

const getValue = (rows: AdminTransactionRow[]) => {
  return rows.reduce((sum, row) => sum + row.qty * row.price, 0);
};

const AdminInventorySummary = ({
  beginningRows,
  additionRows,
  salesRows,
  endingRows,
}: InventorySummaryProps) => {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  // Current form state.
  const beginningQty = getQuantity(beginningRows);
  const additionQty = getQuantity(additionRows);
  const salesQty = getQuantity(salesRows);
  const endingQty = getQuantity(endingRows);

  const beginningValue = getValue(beginningRows);
  const additionValue = getValue(additionRows);
  const salesValue = getValue(salesRows);
  const endingValue = getValue(endingRows);

  const totalAvailableQty = beginningQty + additionQty;
  const totalAvailableValue = beginningValue + additionValue;

  return (
    <div className="mt-4 rounded-lg border border-prince-yellow bg-prince-yellow/20 p-4">
      <h2
        className="font-bold text-2xl text-prince-red text-shadow-sm"
        style={{
          fontFamily: "var(--font-heading)",
        }}
      >
        Inventory Summary
      </h2>

      <div
        className="mt-4 overflow-x-auto"
        style={{
          fontFamily: "var(--font-body)",
        }}
      >
        <table className="w-full min-w-[28rem] border-collapse text-sm">
          <thead>
            <tr className="bg-prince-green text-white">
              <th className="border border-prince-yellow p-2 text-left">
                Category
              </th>

              <th className="border border-prince-yellow p-2 text-center">
                Quantity
              </th>

              <th className="border border-prince-yellow p-2 text-center">
                Value ({currency})
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td className="border border-prince-yellow p-2">
                Beginning Inventory
              </td>

              <td className="border border-prince-yellow p-2 text-center">
                {beginningQty}
              </td>

              <td className="border border-prince-yellow p-2 text-center">
                {beginningValue.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td className="border border-prince-yellow p-2">Additions</td>

              <td className="border border-prince-yellow p-2 text-center">
                {additionQty}
              </td>

              <td className="border border-prince-yellow p-2 text-center">
                {additionValue.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td className="border border-prince-yellow p-2 font-semibold">
                Total Available for Sale
              </td>

              <td className="border border-prince-yellow p-2 text-center font-semibold">
                {totalAvailableQty}
              </td>

              <td className="border border-prince-yellow p-2 text-center font-semibold">
                {totalAvailableValue.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td className="border border-prince-yellow p-2">Sales</td>

              <td className="border border-prince-yellow p-2 text-center">
                {salesQty}
              </td>

              <td className="border border-prince-yellow p-2 text-center">
                {salesValue.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td className="border border-prince-yellow p-2 font-bold">
                Ending Inventory
              </td>

              <td className="border border-prince-yellow p-2 text-center font-bold">
                {endingQty}
              </td>

              <td className="border border-prince-yellow p-2 text-center font-bold">
                {endingValue.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="flex items-center gap-3">
          <span className="font-bold text-prince-red">Ending Inventory:</span>

          <span className="rounded-md border border-prince-yellow bg-prince-green/20 px-4 py-2 font-bold">
            {endingQty} units / {endingValue.toFixed(2)} {currency}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminInventorySummary;
