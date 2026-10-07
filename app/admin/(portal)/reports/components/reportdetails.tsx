//Mandatory imports.

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminReport } from "@/app/admin/types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

type Props = {
  report: AdminReport;
};

function ReportDetail({ report }: Props) {
  // Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );

  const currency = settings.currency || "PHP";
  const prefix = settings.receiptPrefix || "PB-";

  // Report state
  const [isEditing, setIsEditing] = useState(false);
  const [periodStart, setPeriodStart] = useState(report.periodStart);
  const [periodEnd, setPeriodEnd] = useState(report.periodEnd);

  // Request states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const router = useRouter();

  // Editing state functions
  const handleStartEdit = () => {
    setMessage(null);
    setErrorMessage(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setPeriodStart(report.periodStart);
    setPeriodEnd(report.periodEnd);
    setMessage(null);
    setErrorMessage(null);
  };

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    if (!periodStart) {
      setErrorMessage("Report period start is required.");
      setIsSaving(false);
      return;
    }

    if (!periodEnd) {
      setErrorMessage("Report period end is required.");
      setIsSaving(false);
      return;
    }

    if (periodStart > periodEnd) {
      setErrorMessage(
        "Report period start cannot be later than the period end.",
      );
      setIsSaving(false);
      return;
    }

    const formData = new FormData();

    formData.set("report-id", report._id);

    formData.set(
      "report-data",
      JSON.stringify({
        transactionNumber: report.transactionNumber,
        periodStart,
        periodEnd,
      }),
    );

    try {
      const response = await fetch("/admin/routes/reports", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        const errorValues =
          result?.errors && typeof result.errors === "object"
            ? Object.values(result.errors as Record<string, string[]>)
            : [];

        const firstError =
          errorValues[0]?.[0] ?? result?.message ?? "Failed to update report.";

        throw new Error(firstError);
      }

      setMessage(result?.message ?? "Report updated successfully.");

      setIsEditing(false);

      router.push("/admin/reports");
    } catch (error) {
      console.error("Report update failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the report.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete the report for "${report.transactionNumber}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setErrorMessage(null);

    const formData = new FormData();

    formData.set("report-id", report._id);

    try {
      const response = await fetch("/admin/routes/reports", {
        method: "DELETE",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete report.");
      }

      router.push("/admin/reports");
    } catch (error) {
      console.error("Report deletion failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the report.",
      );

      setIsDeleting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-5xl rounded-xl border-2 border-prince-yellow bg-prince-green/20 p-6 shadow-lg">
      {!isEditing ? (
        <>
          <div className="mb-6">
            <h1
              className="text-2xl font-bold text-prince-yellow"
              style={{
                fontFamily: "var(--font-heading)",
              }}
            >
              Report Details
            </h1>
          </div>

          <div
            className="grid gap-3 rounded-lg border border-prince-yellow bg-white p-5 text-left md:grid-cols-2"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            <p>
              <strong>Transaction Number:</strong> {prefix}
              {report.transactionNumber}
            </p>

            <p>
              <strong>Period:</strong>{" "}
              {new Date(report.periodStart).toLocaleDateString()} -{" "}
              {new Date(report.periodEnd).toLocaleDateString()}
            </p>
          </div>

          <div className="mt-6 overflow-x-auto">
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
                {report.rows.map((row) => (
                  <tr key={row.id}>
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

          <div className="mt-4 text-right text-lg font-bold">
            Grand Total: {currency} {report.total.toFixed(2)}
          </div>

          {message && (
            <p className="mt-4 font-semibold text-green-700">{message}</p>
          )}

          {errorMessage && (
            <p className="mt-4 font-semibold text-red-600">{errorMessage}</p>
          )}

          <div className="mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={handleStartEdit}
              className="rounded-md bg-prince-green px-5 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange"
            >
              Edit Report
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-prince-red px-5 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "DELETING..." : "Delete Report"}
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={handleUpdate}
          className="flex flex-col gap-4 text-left"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          <h2 className="text-xl font-bold text-prince-yellow">Edit Report</h2>

          <div>
            <label
              htmlFor="transaction-number"
              className="mb-1 block font-semibold"
            >
              Transaction Number
            </label>

            <input
              id="transaction-number"
              type="text"
              value={`${prefix}${report.transactionNumber}`}
              readOnly
              className="w-full rounded-md border bg-slate-100 p-2"
            />
          </div>

          <div>
            <label htmlFor="period-start" className="mb-1 block font-semibold">
              Period Start
            </label>

            <input
              id="period-start"
              type="date"
              value={periodStart}
              onChange={(event) => setPeriodStart(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="period-end" className="mb-1 block font-semibold">
              Period End
            </label>

            <input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={(event) => setPeriodEnd(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div className="mt-4 overflow-x-auto">
            <h3 className="mb-3 text-lg font-bold">Transaction Items</h3>

            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-prince-green text-white">
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
                {report.rows.map((row) => (
                  <tr key={row.id}>
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

          <div className="mt-4 text-right text-lg font-bold">
            Current Report Total: {currency} {report.total.toFixed(2)}
          </div>

          {errorMessage && (
            <p className="font-semibold text-red-600">{errorMessage}</p>
          )}

          <div className="flex justify-center gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-prince-green px-5 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "SAVING..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="rounded-md bg-slate-300 px-5 py-2 font-bold text-slate-800 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default ReportDetail;
