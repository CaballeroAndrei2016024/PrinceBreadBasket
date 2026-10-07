"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import printIcon from "@/public/print.png";
import printHoverIcon from "@/public/printhover.png";
import type { Report } from "../../types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

type Props = {
  report: Report;
};

export default function PrintReport({ report }: Props) {
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
    documentTitle: `Report-${report.transactionNumber}-${report.periodStart}-${report.periodEnd}`,
  });

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="Print Report"
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
          <h1>Sales Report</h1>

          <hr />

          <p>
            <strong>Transaction Number:</strong> {prefix}
            {report.transactionNumber}
          </p>

          <p>
            <strong>Period:</strong>{" "}
            {new Date(report.periodStart).toLocaleDateString()} -{" "}
            {new Date(report.periodEnd).toLocaleDateString()}
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
              {report.rows.map((row) => (
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
            Grand Total: {currency} {report.total.toFixed(2)}
          </h2>
        </div>
      </div>
    </>
  );
}
