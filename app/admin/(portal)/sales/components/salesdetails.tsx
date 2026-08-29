"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminReport, AdminSalesHeader } from "../../../types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

interface SalesHeaderDetailProps {
  sales: AdminSalesHeader;
  report: AdminReport;
  reports: AdminReport[];
}

function SalesHeaderDetail({ sales, report, reports }: SalesHeaderDetailProps) {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  const prefix = settings.receiptPrefix || "PB-";
  const router = useRouter();

  const [isEditing, setIsEditing] = useState(false);

  //Admin's editable fields.
  const [customerCode, setCustomerCode] = useState(sales.customerCode);
  const [customerName, setCustomerName] = useState(sales.customerName);
  const [date, setDate] = useState(sales.date);
  const [reportId, setReportId] = useState(sales.reportId);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Find the currently selected report.
  const selectedReport = useMemo(
    () =>
      reports.find(
        (availableReport) => String(availableReport._id) === String(reportId),
      ),
    [reports, reportId],
  );

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    //Validation of the salesdetails.
    if (!customerCode.trim()) {
      setErrorMessage("Customer code is required.");
      setIsSaving(false);
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage("Customer name is required.");
      setIsSaving(false);
      return;
    }

    if (!date.trim()) {
      setErrorMessage("Date is required.");
      setIsSaving(false);
      return;
    }

    if (!selectedReport) {
      setErrorMessage("A valid Report must be selected.");
      setIsSaving(false);
      return;
    }

    const salesData = {
      customerCode: customerCode.trim(),
      customerName: customerName.trim(),

      // Keep the original Sales Header transaction number.
      transactionNumber: sales.transactionNumber,

      // The selected Report.
      reportId: String(selectedReport._id),
      reportTransaction: selectedReport.transactionNumber,

      //Fields of the selected report.
      productId: selectedReport.productId,

      date,

      productName: selectedReport.productName,
      productPrice: selectedReport.productPrice,

      periodStart: selectedReport.periodStart,
      periodEnd: selectedReport.periodEnd,

      rows: selectedReport.rows,
      total: selectedReport.total,
    };

    const formData = new FormData();

    formData.set("sales-id", sales._id);
    formData.set("sales-data", JSON.stringify(salesData));

    try {
      const response = await fetch("/admin/routes/sales", {
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
          errorValues[0]?.[0] ??
          result?.message ??
          "Failed to update sales header.";

        throw new Error(firstError);
      }

      setIsEditing(false);
      router.push("/admin/sales");
    } catch (error) {
      console.error("Sales header update failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the sales header.",
      );
    } finally {
      setIsSaving(false);
    }
  }

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

  function handleCancelEdit() {
    setIsEditing(false);

    setCustomerCode(sales.customerCode);
    setCustomerName(sales.customerName);
    setDate(sales.date);
    setReportId(sales.reportId);

    setErrorMessage(null);
  }

  return (
    <section className="mx-auto w-full max-w-3xl text-center">
      {!isEditing ? (
        <>
          <p>
            Transaction Number:{prefix}
            {""} {sales.transactionNumber}
          </p>
          <p>Customer Code: {sales.customerCode}</p>
          <p>Customer Name: {sales.customerName}</p>
          <p>Date: {new Date(sales.date).toLocaleDateString()}</p>

          <hr className="my-6" />

          <p>Report: {report.transactionNumber}</p>
          <p>Product: {report.productName}</p>
          <p>
            Period: {new Date(report.periodStart).toLocaleDateString()} -{" "}
            {new Date(report.periodEnd).toLocaleDateString()}
          </p>
          <p>
            Total: {currency}
            {""}
            {sales.total.toFixed(2)}
          </p>

          {message && (
            <p className="mt-4 font-semibold text-green-700">{message}</p>
          )}

          {errorMessage && (
            <p className="mt-4 font-semibold text-red-600">{errorMessage}</p>
          )}

          <div className="mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setMessage(null);
                setErrorMessage(null);
              }}
              className="rounded-md bg-prince-green px-5 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange"
            >
              Edit Sales Header
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-prince-red px-5 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "DELETING..." : "Delete Sales Header"}
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={handleUpdate}
          className="mt-6 flex flex-col gap-4 text-left"
        >
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
              value={sales.transactionNumber}
              readOnly
              className="w-full rounded-md border bg-slate-100 p-2"
            />
          </div>

          <div>
            <label htmlFor="customer-code" className="mb-1 block font-semibold">
              Customer Code
            </label>

            <input
              id="customer-code"
              type="text"
              value={customerCode}
              onChange={(event) => setCustomerCode(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="customer-name" className="mb-1 block font-semibold">
              Customer Name
            </label>

            <input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="date" className="mb-1 block font-semibold">
              Date
            </label>

            <input
              id="date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="report-id" className="mb-1 block font-semibold">
              Report
            </label>

            <select
              id="report-id"
              value={reportId}
              onChange={(event) => setReportId(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            >
              {reports.map((availableReport) => (
                <option key={availableReport._id} value={availableReport._id}>
                  {availableReport.transactionNumber} —{" "}
                  {availableReport.productName}
                </option>
              ))}
            </select>
          </div>

          {message && <p className="font-semibold text-green-700">{message}</p>}

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
              className="rounded-md bg-slate-300 px-5 py-2 font-bold text-slate-800 transition hover:bg-slate-400 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default SalesHeaderDetail;
