"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import printIcon from "@/public/print.png";
import printHoverIcon from "@/public/printhover.png";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";
import { AdminTransaction } from "@/app/admin/types";

type Props = {
  transaction: AdminTransaction;
};

export default function AdminPrintTransactions({ transaction }: Props) {
  const [hover, setHover] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  const prefix = settings.receiptPrefix || "PB-";

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Transaction-${transaction.transactionNumber}-${transaction.date}`,
  });

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="Print Transaction"
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
          <h1> Transaction</h1>

          <hr />

          <p>
            <strong>Transaction Number:</strong> {prefix}
            {transaction.transactionNumber}
          </p>

          <p>
            <strong>Transaction Type:</strong> {""}
            {transaction.transactionType.replaceAll("_", " ")}
          </p>

          <p>
            <strong>Customer Code:</strong> {""}
            {transaction.customerCode || "N/A"}
          </p>

          <p>
            <strong>Transaction Date:</strong> {""}
            {transaction.date}
          </p>

          <br />

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
              {transaction.rows.map((row) => (
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

                  <td style={{ border: "1px solid black", padding: 8 }}>
                    {currency} {row.price.toFixed(2)}
                  </td>

                  <td style={{ border: "1px solid black", padding: 8 }}>
                    {currency} {(row.qty * row.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <br />

          <h2 style={{ textAlign: "right" }}>
            Grand Total: {currency} {transaction.total.toFixed(2)}
          </h2>
        </div>
      </div>
    </>
  );
}
