"use client";
//Form Imports.
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import LogsInventorySection from "./inventorysection";
import InventorySummary from "./inventorysummary";
import type { Transaction, TransactionRow } from "@/app/(princebread)/types";
import { useRouter } from "next/navigation";

const SalesLogForm = () => {
  //Form declarations for different segments.
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  //Transaction state.
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [salesQuantities, setSalesQuantities] = useState<
    Record<string, number>
  >({});

  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  //Form submission states.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  //Code for different rows.

  const aggregateRows = (
    sourceTransactions: { rows: TransactionRow[] }[],
  ): TransactionRow[] => {
    const grouped = new Map<
      string,
      {
        productId: string;
        productName: string;
        qty: number;
        value: number;
      }
    >();

    for (const transaction of sourceTransactions) {
      for (const row of transaction.rows) {
        const rowValue = row.qty * row.price;
        const existing = grouped.get(row.productId);

        if (existing) {
          existing.qty += row.qty;
          existing.value += rowValue;
        } else {
          grouped.set(row.productId, {
            productId: row.productId,
            productName: row.productName,
            qty: row.qty,
            value: rowValue,
          });
        }
      }
    }

    return Array.from(grouped.values()).map((row) => ({
      id: row.productId,
      productId: row.productId,
      productName: row.productName,
      qty: row.qty,
      price: row.qty > 0 ? row.value / row.qty : 0,
    }));
  };

  //Fetch the transactions based on the period, with a security check.
  useEffect(() => {
    if (!periodStart || !periodEnd) {
      return;
    }

    const controller = new AbortController();

    async function loadTransactions() {
      try {
        setIsLoadingTransactions(true);
        setErrorMessage(null);

        const transactionsResponse = await fetch(
          `/routes/transactions?startDate=${encodeURIComponent(
            periodStart,
          )}&endDate=${encodeURIComponent(periodEnd)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );

        if (!transactionsResponse.ok) {
          throw new Error("Failed to load transactions.");
        }

        const transactionResult = await transactionsResponse.json();

        setTransactions(
          Array.isArray(transactionResult?.transactions)
            ? transactionResult.transactions
            : [],
        );
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        console.error(error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to load transactions.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingTransactions(false);
        }
      }
    }

    loadTransactions();

    return () => controller.abort();
  }, [periodStart, periodEnd]);

  //Transaction rows syntax.

  const activeTransactions = useMemo(
    () => (periodStart && periodEnd ? transactions : []),
    [periodStart, periodEnd, transactions],
  );

  const beginningTransactions = useMemo(
    () =>
      activeTransactions.filter(
        (transaction) => transaction.transactionType === "BEGINNING_INVENTORY",
      ),
    [activeTransactions],
  );

  const additionTransactions = useMemo(
    () =>
      activeTransactions.filter(
        (transaction) => transaction.transactionType === "ADDITION",
      ),
    [activeTransactions],
  );

  const beginningRows = useMemo(
    () => aggregateRows(beginningTransactions),
    [beginningTransactions],
  );

  const additionRows = useMemo(
    () => aggregateRows(additionTransactions),
    [additionTransactions],
  );

  const salesInventoryRows = useMemo(
    () => aggregateRows([...beginningTransactions, ...additionTransactions]),
    [beginningTransactions, additionTransactions],
  );

  const salesRows = useMemo(
    () =>
      salesInventoryRows.map((row) => ({
        ...row,
        qty: salesQuantities[row.productId] ?? 0,
      })),
    [salesInventoryRows, salesQuantities],
  );

  const updateSalesQuantity = (rowId: string, qty: number) => {
    setSalesQuantities((currentQuantities) => ({
      ...currentQuantities,
      [rowId]: qty,
    }));
  };

  //Ending form calculations.

  const endingRows = useMemo(() => {
    const grouped = new Map<
      string,
      {
        productId: string;
        productName: string;
        availableQty: number;
        availableValue: number;
        endingQty: number;
      }
    >();

    // Add Beginning Inventory.
    for (const row of beginningRows) {
      const existing = grouped.get(row.productId);
      const rowValue = row.qty * row.price;

      if (existing) {
        existing.availableQty += row.qty;
        existing.availableValue += rowValue;
        existing.endingQty += row.qty;
      } else {
        grouped.set(row.productId, {
          productId: row.productId,
          productName: row.productName,
          availableQty: row.qty,
          availableValue: rowValue,
          endingQty: row.qty,
        });
      }
    }

    // Additions increase both available inventory and ending inventory.
    for (const row of additionRows) {
      const existing = grouped.get(row.productId);
      const rowValue = row.qty * row.price;

      if (existing) {
        existing.availableQty += row.qty;
        existing.availableValue += rowValue;
        existing.endingQty += row.qty;
      } else {
        grouped.set(row.productId, {
          productId: row.productId,
          productName: row.productName,
          availableQty: row.qty,
          availableValue: rowValue,
          endingQty: row.qty,
        });
      }
    }

    // Sales reduce ending quantity.
    for (const row of salesRows) {
      const existing = grouped.get(row.productId);

      if (existing) {
        existing.endingQty -= row.qty;
      } else {
        grouped.set(row.productId, {
          productId: row.productId,
          productName: row.productName,
          availableQty: 0,
          availableValue: 0,
          endingQty: -row.qty,
        });
      }
    }

    return Array.from(grouped.values()).map((row) => ({
      id: row.productId,
      productId: row.productId,
      productName: row.productName,
      qty: row.endingQty,
      price: row.availableQty > 0 ? row.availableValue / row.availableQty : 0,
    }));
  }, [beginningRows, additionRows, salesRows]);

  //Syntax for form submission.

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

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

    if (endingRows.some((row) => row.qty < 0)) {
      setErrorMessage("Ending inventory cannot contain negative quantities.");
      setIsSubmitting(false);
      return;
    }

    if (activeTransactions.length === 0) {
      setErrorMessage("No transactions were found for the selected period.");
      setIsSubmitting(false);
      return;
    }

    const logPayload = {
      periodStart,
      periodEnd,
      beginningRows,
      additionRows,
      salesRows,
      endingRows,
    };

    console.log("Sales Log payload:", logPayload);

    try {
      const response = await fetch("/routes/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logPayload),
      });

      const result = await response.json().catch(() => null);

      console.log("Server response:", result);

      if (!response.ok) {
        const errorValues =
          result?.errors && typeof result.errors === "object"
            ? Object.values(result.errors as Record<string, string[]>)
            : [];

        const firstError = errorValues[0]?.[0] ?? result?.message;

        throw new Error(
          firstError || `Failed to save Sales Log (HTTP ${response.status}).`,
        );
      }

      setMessage(result?.message || "Sales Log created successfully.");

      setPeriodStart("");
      setPeriodEnd("");
      setTransactions([]);
      router.push("/logs");
    } catch (error) {
      console.error("Sales Log submission failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the Sales Log.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full font-sans">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-6 py-10 text-center md:px-20 space-y-8">
        <div className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg text-white">
          <h1
            className="font-bold text-2xl text-prince-yellow text-shadow-sm"
            style={{
              fontFamily: "var(--font-heading)",
            }}
          >
            Generate Sales Log here.
          </h1>
        </div>

        {errorMessage && (
          <div
            className="w-full max-w-3xl rounded-md bg-red-100 p-3 text-red-700 border border-red-400"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            {errorMessage}
          </div>
        )}
        {message && (
          <div
            className="w-full max-w-3xl rounded-md bg-green-100 p-3 text-green-700 border border-green-400"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            {message}
          </div>
        )}

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
              htmlFor="datefrom"
              className="mb-2 font-bold text-prince-shadow/50"
            >
              Period Start:
            </label>
            <input
              type="date"
              id="datefrom"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
              className="border border-prince-yellow rounded-md p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />

            <label
              htmlFor="dateto"
              className="mb-2 mt-3 font-bold text-prince-shadow/50"
            >
              Period To:
            </label>
            <input
              type="date"
              id="dateto"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="border border-prince-yellow rounded-md p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
          </div>

          <div className="mt-4 w-full">
            <LogsInventorySection
              title="Beginning Inventory"
              rows={beginningRows}
            />
          </div>

          <div className="mt-4 w-full">
            <LogsInventorySection
              title="Additions to Inventory"
              rows={additionRows}
            />
          </div>

          <div className="mt-4 w-full">
            <LogsInventorySection
              title="Sales"
              rows={salesRows}
              editable
              onQuantityChange={updateSalesQuantity}
            />
          </div>

          <div className="mt-4 w-full">
            <LogsInventorySection title="Ending Inventory" rows={endingRows} />
          </div>

          <InventorySummary
            beginningRows={beginningRows}
            additionRows={additionRows}
            salesRows={salesRows}
            endingRows={endingRows}
          />

          <Button
            type="submit"
            disabled={isSubmitting || isLoadingTransactions}
            className="mt-4 rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 transition-colors duration-300 hover:bg-prince-orange"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            {isSubmitting
              ? "SUBMITTING..."
              : isLoadingTransactions
                ? "LOADING..."
                : "SUBMIT SALES LOG"}
          </Button>
        </form>
      </main>
    </div>
  );
};

export default SalesLogForm;
