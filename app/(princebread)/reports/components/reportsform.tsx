"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

type ReportRow = {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  price: number;
};

type TransactionOption = {
  _id: string;
  transactionNumber: string;
  customerCode: string;
  date: string;
  rows: ReportRow[];
  total: number;
};

const SalesReportForm = () => {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";

  // Form header fields
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  //Transaction selection.
  const [transactions, setTransactions] = useState<TransactionOption[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState("");

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  //Function to find selected Transactions.

  const selectedTransactionData = useMemo(
    () =>
      transactions.find(
        (transaction) => transaction.transactionNumber === selectedTransaction,
      ),
    [transactions, selectedTransaction],
  );

  const displayRows = selectedTransactionData?.rows ?? [];

  const grandTotal = selectedTransactionData?.total ?? 0;

  //Loading transactions from the database...

  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await fetch("/routes/sales", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load Sales Header options.");
        }

        const result = await response.json();

        const options = Array.isArray(result?.sales)
          ? result.sales.map(
              (salesHeader: {
                _id?: string;
                transactionNumber?: string;
                customerCode?: string;
                date?: string;
                rows?: ReportRow[];
                total?: number;
              }) => ({
                _id: salesHeader._id ?? "",
                transactionNumber: salesHeader.transactionNumber ?? "",
                customerCode: salesHeader.customerCode ?? "",
                date: salesHeader.date ?? "",
                rows: Array.isArray(salesHeader.rows) ? salesHeader.rows : [],
                total: Number(salesHeader.total ?? 0),
              }),
            )
          : [];

        setTransactions(options);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      }
    }

    loadTransactions();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    if (!selectedTransaction) {
      setErrorMessage("Please select a sales transaction.");
      setIsSubmitting(false);
      return;
    }

    const transaction = selectedTransactionData;

    if (!transaction) {
      setErrorMessage("Selected sales transaction could not be found.");
      setIsSubmitting(false);
      return;
    }

    if (!transaction.rows.length) {
      setErrorMessage("The selected sales transaction has no items.");
      setIsSubmitting(false);
      return;
    }

    if (!periodStart) {
      setErrorMessage("Period start date is required.");
      setIsSubmitting(false);
      return;
    }

    if (!periodEnd) {
      setErrorMessage("Period end date is required.");
      setIsSubmitting(false);
      return;
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
      setErrorMessage("Period start cannot be later than period end.");
      setIsSubmitting(false);
      return;
    }

    const reportPayload = {
      transactionNumber: transaction.transactionNumber,
      periodStart,
      periodEnd,
    };

    console.log("Report payload:", reportPayload);

    try {
      const response = await fetch("/routes/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reportPayload),
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok) {
        const errorValues =
          result?.errors && typeof result.errors === "object"
            ? Object.values(result.errors as Record<string, string[]>)
            : [];
        const firstError = errorValues[0]?.[0] ?? result?.message;
        throw new Error(firstError || "Failed to save report.");
      }

      setMessage(result?.message || "Report created successfully.");
      setSelectedTransaction("");
      setPeriodStart("");
      setPeriodEnd("");
      router.push("/reports");
    } catch (error) {
      console.error("Error during form submission:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the report.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full font-sans ">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-6 py-10 text-center md:px-20 space-y-8">
        <div className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg text-white">
          <h1
            className="font-bold text-2xl text-prince-yellow text-shadow-sm"
            style={{
              fontFamily: "var(--font-heading)",
            }}
          >
            Generate Sales Report here.
          </h1>
        </div>
        <form
          onSubmit={handleSubmit}
          className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow border-2 bg-prince-green-80 p-6 shadow-lg"
        >
          <div
            className="flex flex-col w-full text-left"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            <label
              htmlFor="sales-transaction"
              className="mb-2 font-semibold text-prince-shadow/50"
            >
              Sales Header:
            </label>

            <select
              id="sales-transaction"
              value={selectedTransaction}
              onChange={(e) => setSelectedTransaction(e.target.value)}
              className="rounded-md border border-prince-yellow p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            >
              <option value="">Select a Sales Header</option>

              {transactions.map((transaction) => (
                <option
                  key={transaction.transactionNumber}
                  value={transaction.transactionNumber}
                >
                  {transaction.transactionNumber} - {transaction.date} -{" "}
                  {transaction.customerCode}
                </option>
              ))}
            </select>
            <label
              htmlFor="transaction-number"
              className="mb-2 mt-3 font-semibold text-prince-shadow/50"
            >
              Transaction Number:
            </label>

            <input
              id="transaction-number"
              type="text"
              value={selectedTransactionData?.transactionNumber ?? ""}
              readOnly
              className="rounded-md border border-prince-yellow bg-gray-100 p-2 text-slate-700"
            />
          </div>
          <label
            htmlFor="datefrom"
            className="mt-4 mb-2 font-semibold text-prince-shadow/50"
          >
            Period Start:
          </label>
          <input
            type="date"
            id="datefrom"
            value={periodStart}
            onChange={(e) => setPeriodStart(e.target.value)}
            className="rounded-md border border-prince-yellow p-2 text-slate-700 focus:border-prince-green focus:outline-none"
          />
          <label
            htmlFor="dateto"
            className="mt-4 mb-2 font-semibold text-prince-shadow/50"
          >
            Period End:
          </label>
          <input
            type="date"
            id="dateto"
            value={periodEnd}
            onChange={(e) => setPeriodEnd(e.target.value)}
            className="rounded-md border border-prince-yellow p-2 text-slate-700 focus:border-prince-green focus:outline-none"
          />
          <label
            htmlFor="customer-code"
            className="mb-2 mt-3 font-semibold text-prince-shadow/50"
          >
            Customer Code:
          </label>

          <input
            id="customer-code"
            type="text"
            value={selectedTransactionData?.customerCode ?? ""}
            readOnly
            className="rounded-md border border-prince-yellow bg-gray-100 p-2 text-slate-700"
          />

          <label
            htmlFor="sales-date"
            className="mb-2 mt-3 font-semibold text-prince-shadow/50"
          >
            Sales Date:
          </label>

          <input
            id="sales-date"
            type="date"
            value={selectedTransactionData?.date ?? ""}
            readOnly
            className="rounded-md border border-prince-yellow bg-gray-100 p-2 text-slate-700"
          />

          {/* Transaction Items */}
          <div className="mt-4 w-full rounded-lg border border-prince-yellow bg-prince-yellow/20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h2
                className="font-bold text-2xl text-prince-red text-shadow-sm"
                style={{
                  fontFamily: "var(--font-heading)",
                }}
              >
                Transaction Items
              </h2>
            </div>

            <div
              className="overflow-x-auto"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-prince-green text-white">
                    <th className="border border-prince-yellow p-2 text-left">
                      Product ID
                    </th>

                    <th className="border border-prince-yellow p-2 text-left">
                      Product Name
                    </th>

                    <th className="border border-prince-yellow p-2 text-center w-28">
                      Qty
                    </th>

                    <th className="border border-prince-yellow p-2 text-center w-32">
                      Unit Price ({currency})
                    </th>

                    <th className="border border-prince-yellow p-2 text-center w-32">
                      Total ({currency})
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayRows.map((row) => (
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
                        {row.price.toFixed(2)} {currency}
                      </td>

                      <td className="border border-prince-yellow p-2 text-center font-semibold">
                        {(row.qty * row.price).toFixed(2)} {currency}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div
              className="mt-4 flex items-center justify-between rounded-md border border-prince-green bg-prince-green/10 p-3 text-sm text-slate-700"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              <span>Total:</span>
              <span className="font-semibold">
                {currency} {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Submission States */}
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

          {/* Submit */}
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

export default SalesReportForm;
