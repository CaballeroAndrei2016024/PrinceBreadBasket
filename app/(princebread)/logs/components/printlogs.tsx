"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import printIcon from "@/public/print.png";
import printHoverIcon from "@/public/printhover.png";
import type { Log, TransactionRow } from "@/app/(princebread)/types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

type Props = {
  log: Log;
};

//Summary Row types for Sales.
type SummaryRow = {
  productId: string;
  productName: string;
  qty: number;
  value: number;
  averagePrice: number;
};

function formatCurrency(value: number, currency: string) {
  return `${currency} ${value.toFixed(2)}`;
}

//How to configure the total cost for each section of the Logs.

function getRowTotal(row: TransactionRow) {
  return row.qty * row.price;
}

function buildTotalAvailableRows(
  beginningRows: TransactionRow[],
  additionRows: TransactionRow[],
): SummaryRow[] {
  const grouped = new Map<
    string,
    {
      productId: string;
      productName: string;
      qty: number;
      value: number;
    }
  >();

  for (const row of [...beginningRows, ...additionRows]) {
    const existing = grouped.get(row.productId);

    if (existing) {
      existing.qty += row.qty;
      existing.value += getRowTotal(row);
    } else {
      grouped.set(row.productId, {
        productId: row.productId,
        productName: row.productName,
        qty: row.qty,
        value: getRowTotal(row),
      });
    }
  }

  return Array.from(grouped.values()).map((row) => ({
    ...row,
    averagePrice: row.qty > 0 ? row.value / row.qty : 0,
  }));
}

function InventoryTable({
  title,
  rows,
}: {
  title: string;
  rows: TransactionRow[];
}) {
  //Settings.
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  const total = rows.reduce((sum, row) => sum + row.qty * row.price, 0);

  return (
    <div style={{ marginBottom: "24px" }}>
      <h3 style={{ marginBottom: "8px" }}>{title}</h3>

      <table
        style={{
          width: "100%",
          minWidth: "640px",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid black", padding: 8 }}>
              Product ID
            </th>

            <th style={{ border: "1px solid black", padding: 8 }}>
              Product Name
            </th>

            <th style={{ border: "1px solid black", padding: 8 }}>Quantity</th>

            <th style={{ border: "1px solid black", padding: 8 }}>
              Unit Price
            </th>

            <th style={{ border: "1px solid black", padding: 8 }}>Total</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                style={{
                  border: "1px solid black",
                  padding: 8,
                  textAlign: "center",
                }}
              >
                No entries
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row.id}>
                <td style={{ border: "1px solid black", padding: 8 }}>
                  {row.productId}
                </td>
                <td style={{ border: "1px solid black", padding: 8 }}>
                  {row.productName}
                </td>

                <td style={{ border: "1px solid black", padding: 8 }}>
                  {row.qty}
                </td>

                <td
                  style={{
                    border: "1px solid black",
                    padding: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  {currency} {row.price.toFixed(2)}
                </td>

                <td
                  style={{
                    border: "1px solid black",
                    padding: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  {currency} {(row.qty * row.price).toFixed(2)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p style={{ textAlign: "right", marginTop: "8px" }}>
        <strong>Section Total:</strong>
        {formatCurrency(total, currency)}
      </p>
    </div>
  );
}

export default function PrintSalesLog({ log }: Props) {
  //Settings.
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  //Functionalities for printing.
  const [hover, setHover] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Sales-Log-${log.periodStart}-${log.periodEnd}`,
  });

  const beginningTotal = log.beginningRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );
  const additionTotal = log.additionRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  const salesTotal = log.salesRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  const endingTotal = log.endingRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  const totalAvailableRows = buildTotalAvailableRows(
    log.beginningRows,
    log.additionRows,
  );

  const totalAvailableGrandTotal = totalAvailableRows.reduce(
    (sum, row) => sum + row.value,
    0,
  );

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="Print Sales Log"
        className="shrink-0 rounded-lg p-2 transition-colors duration-200 hover:bg-gray-200"
      >
        <Image
          src={hover ? printHoverIcon : printIcon}
          alt="Print"
          width={32}
          height={32}
          className="h-8 w-8 shrink-0"
        />
      </button>

      <div
        style={{
          overflow: "hidden",
          height: 0,
          fontFamily: "var(--font-body)",
        }}
      >
        <div
          ref={contentRef}
          style={{
            padding: "30px",
            backgroundColor: "white",
            color: "black",
          }}
        >
          <h1>Sales Log</h1>

          <hr />

          <p>
            <strong>Period:</strong>{" "}
            {new Date(log.periodStart).toLocaleDateString()} -{" "}
            {new Date(log.periodEnd).toLocaleDateString()}
          </p>

          <p>
            <strong>Created At:</strong>{" "}
            {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}
          </p>

          <br />

          <InventoryTable
            title="Beginning Inventory"
            rows={log.beginningRows}
          />

          <InventoryTable title="Additions" rows={log.additionRows} />

          <InventoryTable title="Sales" rows={log.salesRows} />

          <InventoryTable title="Ending Inventory" rows={log.endingRows} />

          <br />

          <h2 style={{ textAlign: "right" }}>
            Beginning Total: {formatCurrency(beginningTotal, currency)}
          </h2>

          <h2 style={{ textAlign: "right" }}>
            Additions Total: {formatCurrency(additionTotal, currency)}
          </h2>

          <h2 style={{ textAlign: "right" }}>
            Sales Total: {formatCurrency(salesTotal, currency)}
          </h2>

          <h2 style={{ textAlign: "right" }}>
            Ending Total: {formatCurrency(endingTotal, currency)}
          </h2>

          <br />

          <h2>Total Available for Sales</h2>

          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginTop: "8px",
              marginBottom: "16px",
            }}
          >
            <thead>
              <tr>
                <th style={{ border: "1px solid black", padding: 8 }}>
                  Product ID
                </th>
                <th style={{ border: "1px solid black", padding: 8 }}>
                  Product Name
                </th>

                <th style={{ border: "1px solid black", padding: 8 }}>
                  Quantity
                </th>

                <th
                  style={{
                    border: "1px solid black",
                    padding: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  Average Unit Price
                </th>

                <th
                  style={{
                    border: "1px solid black",
                    padding: 8,
                    whiteSpace: "nowrap",
                  }}
                >
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {totalAvailableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    style={{
                      border: "1px solid black",
                      padding: 8,
                      textAlign: "center",
                    }}
                  >
                    No entries
                  </td>
                </tr>
              ) : (
                totalAvailableRows.map((row) => (
                  <tr key={row.productId}>
                    <td style={{ border: "1px solid black", padding: 8 }}>
                      {row.productId}
                    </td>

                    <td style={{ border: "1px solid black", padding: 8 }}>
                      {row.productName}
                    </td>

                    <td style={{ border: "1px solid black", padding: 8 }}>
                      {row.qty}
                    </td>

                    <td style={{ border: "1px solid black", padding: 8 }}>
                      {currency} {row.averagePrice.toFixed(2)}
                    </td>

                    <td style={{ border: "1px solid black", padding: 8 }}>
                      {currency} {row.value.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <h2 style={{ textAlign: "right" }}>
            Total Available Value: {currency}{" "}
            {totalAvailableGrandTotal.toFixed(2)}
          </h2>
        </div>
      </div>
    </>
  );
}
