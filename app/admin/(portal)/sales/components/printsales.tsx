"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useReactToPrint } from "react-to-print";

import printIcon from "@/public/print.png";
import printHoverIcon from "@/public/printhover.png";
import type { AdminSalesHeader } from "../../../types";

type Props = {
  sales: AdminSalesHeader;
};

export default function AdminPrintSalesHeader({ sales }: Props) {
  const [hover, setHover] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle: `Sales-${sales.transactionNumber}`,
  });

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        aria-label="Print Sales"
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
          <h1>Sales Invoice</h1>

          <hr />

          <p>
            <strong>Transaction Number:</strong> {sales.transactionNumber}
          </p>

          <p>
            <strong>Customer Code:</strong> {sales.customerCode}
          </p>

          <p>
            <strong>Customer Name:</strong> {sales.customerName}
          </p>

          <p>
            <strong>Date:</strong> {new Date(sales.date).toLocaleDateString()}
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
                  Product
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
              {sales.rows.map((row) => (
                <tr key={row.id}>
                  <td style={{ border: "1px solid black", padding: 8 }}>
                    {sales.productName}
                  </td>

                  <td style={{ border: "1px solid black", padding: 8 }}>
                    {row.qty}
                  </td>

                  <td style={{ border: "1px solid black", padding: 8 }}>
                    ₱{row.price.toFixed(2)}
                  </td>

                  <td style={{ border: "1px solid black", padding: 8 }}>
                    ₱{(row.qty * row.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <br />

          <h2 style={{ textAlign: "right" }}>
            Grand Total: ₱{sales.total.toFixed(2)}
          </h2>
        </div>
      </div>
    </>
  );
}
