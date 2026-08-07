"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ReportOption = {
  _id: string;
  transactionNumber: string;
  productId: string;
  productName: string;
  productPrice: number;
  periodStart: string;
  periodEnd: string;
  total: number;
  rows: TransactionRow[];
};

type TransactionRow = {
  id: string;
  date: string;
  qty: number;
  price: number;
};

const SalesHeaderForm = () => {
  const router = useRouter();

  // Form header fields
  const [date, setDate] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");

  // Transaction rows
  const [rows, setRows] = useState<TransactionRow[]>([
    { id: "row-1", date: "", qty: 0, price: 0 },
  ]);

  // Report row

  const [reports, setReports] = useState<ReportOption[]>([]);
  const [selectedReport, setSelectedReport] = useState("");

  const selectedReportData = useMemo(
    () => reports.find((report) => report.transactionNumber === selectedReport),
    [reports, selectedReport],
  );

  //Dates.

  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayRows = rows.map((row) => ({
    ...row,
    price:
      row.price === 0 ? (selectedReportData?.productPrice ?? 0) : row.price,
  }));

  const grandTotal = displayRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    // Validation
    if (!date.trim()) {
      setErrorMessage("Date is required.");
      setIsSubmitting(false);
      return;
    }

    if (!customerCode.trim()) {
      setErrorMessage("Customer code is required.");
      setIsSubmitting(false);
      return;
    }

    if (!customerName.trim()) {
      setErrorMessage("Customer name is required.");
      setIsSubmitting(false);
      return;
    }

    if (!transactionNumber.trim()) {
      setErrorMessage("Transaction number is required.");
      setIsSubmitting(false);
      return;
    }

    if (rows.length === 0) {
      setErrorMessage("At least one transaction row is required.");
      setIsSubmitting(false);
      return;
    }

    if (rows.some((row) => !row.date.trim())) {
      setErrorMessage("All transaction rows must have a date.");
      setIsSubmitting(false);
      return;
    }

    if (rows.some((row) => row.qty <= 0)) {
      setErrorMessage("Quantity must be greater than zero for each row.");
      setIsSubmitting(false);
      return;
    }

    if (!selectedReport) {
      setErrorMessage("Please select a report.");
      setIsSubmitting(false);
      return;
    }

    // Build payload matching SalesSchema
    const salesPayload = {
      customerCode: customerCode.trim(),
      customerName: customerName.trim(),
      transactionNumber: transactionNumber.trim(),
      reportId: selectedReportData?._id,
      reportTransaction: selectedReport,
      date,
      productId: selectedReportData?.productId,

      periodStart,
      periodEnd,

      rows: displayRows,
      total: grandTotal,
    };

    console.log("Sales payload:", salesPayload);

    try {
      const response = await fetch("/routes/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(salesPayload),
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok) {
        const errorValues =
          result?.errors && typeof result.errors === "object"
            ? Object.values(result.errors as Record<string, string[]>)
            : [];
        const firstError = errorValues[0]?.[0] ?? result?.message;
        throw new Error(firstError || "Failed to save sales.");
      }

      setMessage(result?.message || "Sales Header created successfully.");
      // Reset form
      setDate("");
      setCustomerCode("");
      setCustomerName("");
      setTransactionNumber("");
      setRows([{ id: "row-1", date: "", qty: 0, price: 0 }]);
      setSelectedReport("");
      setPeriodStart("");
      setPeriodEnd("");
      router.push("/sales/primary");
    } catch (error) {
      console.error("Error during form submission:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the sales.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  //Dropdown list of reports for the sales header.
  useEffect(() => {
    async function loadReports() {
      try {
        const response = await fetch("/routes/reports", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load reports options");
        }
        const result = await response.json();
        const options = (result?.reports ?? []).map(
          (reports: ReportOption) => ({
            _id: reports._id,
            transactionNumber: reports.transactionNumber ?? reports._id,
            productId: reports.productId ?? reports.productName ?? reports._id,
            productName: reports.productName ?? "",
            productPrice:
              typeof reports.productPrice === "number"
                ? reports.productPrice
                : Number(reports.productPrice) || 0,
            periodStart: reports.periodStart ?? "",
            periodEnd: reports.periodEnd ?? "",
            total: reports.total ?? 0,
            rows: reports.rows ?? [],
          }),
        );
        setReports(options);
        if (options.length > 0) {
          const first = options[0];

          setSelectedReport(first.transactionNumber);
          setPeriodStart(first.periodStart);
          setPeriodEnd(first.periodEnd);

          setRows(
            first.rows.length > 0
              ? first.rows.map((row: TransactionRow, index: number) => ({
                  id: `row-${index + 1}`,
                  date: row.date,
                  qty: row.qty,
                  price: row.price,
                }))
              : [
                  {
                    id: "row-1",
                    date: "",
                    qty: 0,
                    price: first.productPrice,
                  },
                ],
          );
        }
      } catch (error) {
        console.error(error);
      }
    }
    loadReports();
  }, []);

  //The syntax to remove, and update rows in the transaction table.

  const updateRow = (rowId: string, changes: Partial<TransactionRow>) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, ...changes } : row,
      ),
    );
  };

  const removeRow = (rowId: string) => {
    setRows((currentRows) =>
      currentRows.length > 1
        ? currentRows.filter((row) => row.id !== rowId)
        : currentRows,
    );
  };

  return (
    //Actual Form Syntax.
    <div className="flex flex-col flex-1 w-full font-sans">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-6 py-10 text-center md:px-20 space-y-8">
        <div className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg text-white">
          <h1
            className="mb-3 text-2xl font-bold text-prince-yellow font-heading text-shadow-sm"
            style={{
              fontFamily: "var(--font-heading)",
            }}
          >
            Generate Sales Header here.
          </h1>
        </div>
        <form
          className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow border-2 bg-prince-green-80 p-6 shadow-lg bg-prince-green/20"
          onSubmit={handleSubmit}
        >
          <div
            className="flex flex-col w-full text-left"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            <label
              htmlFor="date"
              className="mb-2 font-semibold text-prince-shadow/50 "
            >
              Date:
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="rounded-md border border-prince-yellow  p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
            <label
              htmlFor="customercode"
              className="mb-2 mt-3 font-semibold text-prince-shadow/50"
            >
              Customer Code:
            </label>
            <input
              type="text"
              id="customercode"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              className="rounded-md border border-prince-yellow  p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
            <label
              htmlFor="customername"
              className="mb-2 mt-3 font-semibold text-prince-shadow/50"
            >
              Customer Name:
            </label>
            <input
              type="text"
              id="customername"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="rounded-md border border-prince-yellow  p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
            <label
              htmlFor="transactionnumber"
              className="mb-2 mt-3 font-semibold text-prince-shadow/50"
            >
              Transaction Number:
            </label>

            <input
              id="transactionnumber"
              type="text"
              value={transactionNumber}
              onChange={(e) => setTransactionNumber(e.target.value)}
              className="rounded-md border border-prince-yellow p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
          </div>

          {/* This section is the 5-column input fields that input data for products.
            for the sales header.*/}
          <div className="mt-4 w-full rounded-lg border border-prince-yellow bg-prince-yellow/20 p-4">
            <h2
              className="font-bold text-2xl text-prince-red text-shadow-sm mb-4"
              style={{
                fontFamily: "var(--font-heading)",
              }}
            >
              Transaction Items
            </h2>

            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr
                    className="bg-prince-green text-white"
                    style={{
                      fontFamily: "var(--font-heading)",
                    }}
                  >
                    <th className="border border-prince-yellow p-2 text-left">
                      Product Date:
                    </th>
                    <th className="border border-prince-yellow p-2 text-center w-24">
                      Qty
                    </th>
                    <th className="border border-prince-yellow p-2 text-center w-28">
                      Unit Price
                    </th>
                    <th className="border border-prince-yellow p-2 text-center w-28">
                      Total
                    </th>
                    <th className="border border-prince-yellow p-2 text-center w-20">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayRows.map((row) => (
                    <tr key={row.id} className="hover:bg-prince-yellow/10">
                      <td
                        className="border border-prince-yellow p-2"
                        style={{
                          fontFamily: "var(--font-body)",
                        }}
                      >
                        <div className="text-center">{row.date}</div>
                      </td>
                      <td className="border border-prince-yellow p-2 text-center">
                        <input
                          type="number"
                          value={row.qty}
                          onChange={(e) =>
                            updateRow(row.id, {
                              qty: Number(e.target.value) || 0,
                            })
                          }
                          min="0"
                          className="w-full rounded-md border border-gray-300 p-1 text-slate-700 text-center"
                        />
                      </td>
                      <td className="border border-prince-yellow p-2 text-center">
                        <input
                          type="number"
                          step="0.01"
                          value={row.price}
                          readOnly
                          min="0"
                          className="w-full rounded-md border border-gray-300 p-1 text-slate-700 text-center"
                        />
                      </td>
                      <td className="border border-prince-yellow p-2 text-center font-semibold">
                        {(row.qty * row.price).toFixed(2)}
                      </td>
                      <td className="border border-prince-yellow p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="flex justify-end bg-prince-green/20 p-3 rounded-md"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              <span
                className="font-bold text-lg text-prince-shadow"
                style={{
                  fontFamily: "var(--font-body)",
                }}
              >
                Grand Total: {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          <label
            htmlFor="report-transaction"
            className="mb-2 mt-4 font-semibold text-prince-shadow text-shadow-sm"
            style={{
              fontFamily: "var(--font-heading)",
            }}
          >
            Report Number:
          </label>
          <select
            id="report-transaction"
            name="report-id"
            value={selectedReport}
            onChange={(e) => {
              const value = e.target.value;
              setSelectedReport(value);

              const report = reports.find((r) => r.transactionNumber === value);

              if (!report) return;

              setPeriodStart(report.periodStart);
              setPeriodEnd(report.periodEnd);

              setRows(
                report.rows.length > 0
                  ? report.rows.map((row, index) => ({
                      id: `row-${index + 1}`,
                      date: row.date,
                      qty: row.qty,
                      price: row.price,
                    }))
                  : [
                      {
                        id: "row-1",
                        date: "",
                        qty: 0,
                        price: report.productPrice,
                      },
                    ],
              );
            }}
            className="rounded-md border border-prince-yellow p-2 text-slate-700 focus:border-prince-green focus:outline-none"
          >
            {reports.map((reports) => (
              <option
                key={reports.transactionNumber ?? reports._id}
                value={reports.transactionNumber ?? reports._id}
              >
                {reports.transactionNumber} - {reports.periodStart} to{" "}
                {reports.periodEnd}
              </option>
            ))}
          </select>

          <div className="mt-4 grid grid-cols-2 gap-4 w-full">
            <div className="flex flex-col">
              <label
                htmlFor="periodStart"
                className="mb-2 font-semibold text-prince-shadow/50"
              >
                Period Start:
              </label>
              <input
                id="periodStart"
                type="date"
                value={periodStart}
                readOnly
                className="rounded-md border border-prince-yellow p-2 text-slate-700 bg-gray-100"
              />
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="periodEnd"
                className="mb-2 font-semibold text-prince-shadow/50"
              >
                Period End:
              </label>
              <input
                id="periodEnd"
                type="date"
                value={periodEnd}
                readOnly
                className="rounded-md border border-prince-yellow p-2 text-slate-700 bg-gray-100"
              />
            </div>
          </div>

          {errorMessage && (
            <div
              className="mt-4 w-full rounded-md bg-red-100 border border-red-500 p-3 text-red-700"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              {errorMessage}
            </div>
          )}

          {message && (
            <div
              className="mt-4 w-full rounded-md bg-green-100 border border-green-500 p-3 text-green-700"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              {message}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 transition-colors duration-300 hover:bg-prince-orange disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default SalesHeaderForm;

//Yes, I intentioanlly want to store the buisness PID for the Product, not MongoDB's ID.
