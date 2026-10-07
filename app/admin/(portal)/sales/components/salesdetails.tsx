"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminSalesHeader } from "../../../types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

interface SalesHeaderDetailProps {
  sales: AdminSalesHeader;
}

function SalesHeaderDetail({ sales }: SalesHeaderDetailProps) {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  const prefix = settings.receiptPrefix || "PB-";
  const router = useRouter();

  const [isDeleting, setIsDeleting] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete sales transaction "${sales.transactionNumber}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("sales-id", sales._id);

    try {
      const response = await fetch("/admin/routes/sales", {
        method: "DELETE",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete sales header.");
      }

      router.push("/admin/sales");
    } catch (error) {
      console.error("Sales header deletion failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the sales header.",
      );

      setIsDeleting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-4xl text-center">
      <div className="rounded-xl border border-prince-yellow bg-prince-green/20 p-6 shadow-lg">
        <h1
          className="mb-6 text-2xl font-bold text-prince-yellow"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Sales Header Details
        </h1>

        <div
          className="space-y-3 text-left"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          <p>
            <strong>Transaction Number:</strong> {prefix}
            {sales.transactionNumber}
          </p>

          <p>
            <strong>Transaction ID:</strong> {sales.transactionId}
          </p>

          <p>
            <strong>Customer Code:</strong> {sales.customerCode}
          </p>

          <p>
            <strong>Date:</strong> {new Date(sales.date).toLocaleDateString()}
          </p>
        </div>

        <hr className="my-6" />

        <h2
          className="mb-4 text-xl font-bold text-prince-red"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Transaction Items
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr
                className="bg-prince-green text-white"
                style={{
                  fontFamily: "var(--font-heading)",
                }}
              >
                <th className="border border-prince-yellow p-2 text-left">
                  Product ID
                </th>

                <th className="border border-prince-yellow p-2 text-left">
                  Product Name
                </th>

                <th className="border border-prince-yellow p-2 text-center">
                  Quantity
                </th>

                <th className="border border-prince-yellow p-2 text-center">
                  Unit Price
                </th>

                <th className="border border-prince-yellow p-2 text-center">
                  Total
                </th>
              </tr>
            </thead>

            <tbody>
              {sales.rows.map((row) => (
                <tr key={row.id} className="hover:bg-prince-yellow/10">
                  <td className="border border-prince-yellow p-2">
                    {row.productId}
                  </td>

                  <td className="border border-prince-yellow p-2">
                    {row.productName}
                  </td>

                  <td className="border border-prince-yellow p-2 text-center">
                    {row.qty}
                  </td>

                  <td className="border border-prince-yellow p-2 text-center">
                    {currency} {row.price.toFixed(2)}
                  </td>

                  <td className="border border-prince-yellow p-2 text-center font-semibold">
                    {currency} {(row.qty * row.price).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          className="mt-6 flex justify-end rounded-md bg-prince-green/20 p-3"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          <span className="text-lg font-bold text-prince-shadow">
            Grand Total: {currency} {sales.total.toFixed(2)}
          </span>
        </div>

        {errorMessage && (
          <p className="mt-4 font-semibold text-red-600">{errorMessage}</p>
        )}

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-md bg-prince-red px-5 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isDeleting ? "DELETING..." : "Delete Sales Header"}
          </button>
        </div>
      </div>
    </section>
  );
}

export default SalesHeaderDetail;
