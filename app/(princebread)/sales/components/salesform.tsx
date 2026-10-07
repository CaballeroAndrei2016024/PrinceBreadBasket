"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

type TransactionRow = {
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
  transactionType: "BEGINNING_INVENTORY" | "ADDITION" | "SALES";
  date: string;
  rows: TransactionRow[];
  total: number;
};

type CustomerOption = {
  _id: string;
  customerCode?: string;
  customerName: string;
};

const SalesHeaderForm = () => {
  //Settings.
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Customers
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");

  const [productSearch, setProductSearch] = useState("");

  //Transactions.

  const [transactions, setTransactions] = useState<TransactionOption[]>([]);
  const [selectedTransaction, setSelectedTransaction] = useState("");

  const selectedTransactionData = useMemo(
    () =>
      transactions.find(
        (transaction) => transaction.transactionNumber === selectedTransaction,
      ),
    [transactions, selectedTransaction],
  );

  const displayRows = selectedTransactionData?.rows ?? [];

  const grandTotal = selectedTransactionData?.total ?? 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    // Validation

    if (!selectedTransaction) {
      setErrorMessage("Please select a transaction.");
      setIsSubmitting(false);
      return;
    }

    const transaction = selectedTransactionData;

    if (!transaction) {
      setErrorMessage("Selected transaction could not be found.");
      setIsSubmitting(false);
      return;
    }

    if (transaction.transactionType !== "SALES") {
      setErrorMessage("Only SALES transactions can be added to Sales.");
      setIsSubmitting(false);
      return;
    }

    if (!transaction.customerCode.trim()) {
      setErrorMessage("The selected transaction has no customer.");
      setIsSubmitting(false);
      return;
    }

    if (!transaction.rows.length) {
      setErrorMessage("The selected transaction has no items.");
      setIsSubmitting(false);
      return;
    }

    // Build payload matching SalesSchema
    const salesPayload = {
      transactionNumber: transaction.transactionNumber,
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
      setSelectedTransaction("");
      router.push("/sales");
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

  //Dropdown list of customers for the sales header.
  useEffect(() => {
    async function loadCustomers() {
      try {
        const response = await fetch("/routes/customers", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load customer options.");
        }

        const result = await response.json();

        const options = (result?.customers ?? [])
          .filter(
            (customer: CustomerOption) =>
              customer.customerCode && customer.customerName,
          )
          .map((customer: CustomerOption) => ({
            _id: customer._id,
            customerCode: customer.customerCode,
            customerName: customer.customerName,
          }));

        setCustomers(options);
      } catch (error) {
        console.error("Failed to load customers:", error);
      }
    }

    loadCustomers();
  }, []);

  //Dropdown list of transactions for the sales header.
  useEffect(() => {
    async function loadTransactions() {
      try {
        const response = await fetch("/routes/transactions", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load transaction options");
        }

        const result = await response.json();

        const options = (result?.transactions ?? [])
          .filter(
            (transaction: TransactionOption) =>
              transaction.transactionType === "SALES",
          )
          .map((transaction: TransactionOption) => ({
            _id: transaction._id,
            transactionNumber: transaction.transactionNumber,
            customerCode: transaction.customerCode ?? "",
            transactionType: transaction.transactionType,
            date: transaction.date ?? "",
            rows: transaction.rows ?? [],
            total:
              typeof transaction.total === "number"
                ? transaction.total
                : Number(transaction.total) || 0,
          }));

        setTransactions(options);

        if (options.length > 0) {
          setSelectedTransaction(options[0].transactionNumber);
        }
      } catch (error) {
        console.error("Failed to load transactions:", error);
      }
    }

    loadTransactions();
  }, []);

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
              htmlFor="transaction-date"
              className="mb-2 mt-3 font-semibold text-prince-shadow/50"
            >
              Transaction Date:
            </label>

            <input
              id="transaction-date"
              type="date"
              value={selectedTransactionData?.date ?? ""}
              readOnly
              className="rounded-md border border-prince-yellow bg-gray-100 p-2 text-slate-700"
            />
            <label
              htmlFor="transaction-number"
              className="mb-2 mt-4 font-semibold text-prince-shadow text-shadow-sm"
            >
              Transaction Number:
            </label>

            <select
              id="transaction-number"
              value={selectedTransaction}
              onChange={(e) => setSelectedTransaction(e.target.value)}
              className="rounded-md border border-prince-yellow p-2 text-slate-700"
            >
              <option value="">Select a transaction</option>

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
          </div>

          {/* Product data is from Sales Transactions.*/}
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
                      Product ID
                    </th>

                    <th className="border border-prince-yellow p-2 text-left">
                      Product Name
                    </th>

                    <th className="border border-prince-yellow p-2 text-center w-24">
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
                Grand Total: {currency} {""} {grandTotal.toFixed(2)}
              </span>
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
