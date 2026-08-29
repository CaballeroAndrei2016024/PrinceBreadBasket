"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useSyncExternalStore } from "react";
import { useReactToPrint } from "react-to-print";

import printIcon from "@/public/print.png";
import printHoverIcon from "@/public/printhover.png";
import { AdminSalesLog } from "@/app/admin/types";
import { InventoryRow, AdminProductOption } from "./inventory.types";
import { getSettings, subscribeSettings } from "@/lib/settings";

type Props = {
  log: AdminSalesLog;
  products?: AdminProductOption[];
};

type SummaryRow = {
  productId: string;
  productName: string;
  price: number;
  qty: number;
};

function formatCurrency(value: number, currency: string) {
  return `${currency} ${value.toFixed(2)}`;
}

function buildSummaryRows(
  beginningRows: InventoryRow[],
  additionRows: InventoryRow[],
  endingRows: InventoryRow[],
  products: AdminProductOption[] = [],
) {
  const grouped = new Map<string, SummaryRow>();

  for (const row of [...beginningRows, ...additionRows]) {
    if (!row.productId) continue;

    const product = products.find((item) => item.productId === row.productId);
    const productName = product?.productName ?? row.productId;
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

  const sales = totalAvailable.map((row) => {
    const endingQty = endingRows
      .filter(
        (item) => item.productId === row.productId && item.price === row.price,
      )
      .reduce((sum, item) => sum + item.qty, 0);

    return {
      ...row,
      qty: row.qty - endingQty,
    };
  });

  return { totalAvailable, sales };
}

function InventoryTable({
  title,
  rows,
  currency,
}: {
  title: string;
  rows: InventoryRow[];
  currency: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.qty * row.price, 0);

  return (
    <div style={{ marginBottom: "24px" }}>
      <h3 style={{ marginBottom: "8px" }}>{title}</h3>

      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th style={{ border: "1px solid black", padding: 8 }}>
              Product ID
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
                colSpan={4}
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
                  {row.qty}
                </td>
                <td style={{ border: "1px solid black", padding: 8 }}>
                  {formatCurrency(row.price, currency)}
                </td>
                <td style={{ border: "1px solid black", padding: 8 }}>
                  {formatCurrency(row.qty * row.price, currency)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      <p style={{ textAlign: "right", marginTop: "8px" }}>
        <strong>Section Total:</strong> {formatCurrency(total, currency)}
      </p>
    </div>
  );
}

export default function AdminPrintSalesLog({ log, products = [] }: Props) {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  const [hover, setHover] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Sales-Log-${log.transactionNumber || "untitled"}`,
  });

  const beginningTotal = log.beginningRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );
  const additionTotal = log.additionRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );
  const endingTotal = log.endingRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  const { totalAvailable, sales } = buildSummaryRows(
    log.beginningRows,
    log.additionRows,
    log.endingRows,
    products,
  );

  const totalAvailableGrandTotal = totalAvailable.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  const salesGrandTotal = sales.reduce(
    (sum, row) => sum + row.qty * row.price,
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
        className="rounded-lg p-2 transition-colors duration-200 hover:bg-gray-200"
      >
        <Image
          src={hover ? printHoverIcon : printIcon}
          alt="Print"
          width={32}
          height={32}
        />
      </button>

      <div
        style={{
          display: "none",
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
            <strong>Transaction Number:</strong> {log.transactionNumber}
          </p>

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
            currency={currency}
          />
          <InventoryTable
            title="Additions"
            rows={log.additionRows}
            currency={currency}
          />
          <InventoryTable
            title="Ending Inventory"
            rows={log.endingRows}
            currency={currency}
          />

          <br />

          <h2 style={{ textAlign: "right" }}>
            Beginning Total: {formatCurrency(beginningTotal, currency)}
          </h2>
          <h2 style={{ textAlign: "right" }}>
            Additions Total: {formatCurrency(additionTotal, currency)}
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
                <th style={{ border: "1px solid black", padding: 8 }}>
                  Unit Price
                </th>
                <th style={{ border: "1px solid black", padding: 8 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {totalAvailable.map((row) => (
                <tr key={`${row.productId}-${row.price}`}>
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
                    {formatCurrency(row.price, currency)}
                  </td>
                  <td style={{ border: "1px solid black", padding: 8 }}>
                    {formatCurrency(row.qty * row.price, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2 style={{ textAlign: "right" }}>
            Grand Total: {formatCurrency(totalAvailableGrandTotal, currency)}
          </h2>

          <br />

          <h2>Sales</h2>
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
                <th style={{ border: "1px solid black", padding: 8 }}>
                  Unit Price
                </th>
                <th style={{ border: "1px solid black", padding: 8 }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((row) => (
                <tr key={`${row.productId}-${row.price}`}>
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
                    {formatCurrency(row.price, currency)}
                  </td>
                  <td style={{ border: "1px solid black", padding: 8 }}>
                    {formatCurrency(row.qty * row.price, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h2 style={{ textAlign: "right" }}>
            Grand Total: {formatCurrency(salesGrandTotal, currency)}
          </h2>
        </div>
      </div>
    </>
  );
}
