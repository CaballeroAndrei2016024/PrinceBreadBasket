"use client";
//Main Form component.
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import LogsInventorySection from "./inventorysection";
import InventorySummary from "./inventorysummary";
import type { InventoryRow, ProductOption } from "./inventory.types";
import { useRouter } from "next/navigation";

const createEmptyRow = (): InventoryRow => ({
  id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  productId: "",
  qty: 0,
  price: 0,
});

const SalesLogForm = () => {
  //Form declarations for different segments.
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [beginningRows, setBeginningRows] = useState<InventoryRow[]>([
    createEmptyRow(),
  ]);
  const [additionRows, setAdditionRows] = useState<InventoryRow[]>([
    createEmptyRow(),
  ]);
  const [endingRows, setEndingRows] = useState<InventoryRow[]>([
    createEmptyRow(),
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  //Code for different rows.

  function syncEndingRows(
    beginning: InventoryRow[],
    additions: InventoryRow[],
  ) {
    const combined = [...beginning, ...additions];

    const grouped = new Map<
      string,
      {
        productId: string;
        price: number;
      }
    >();

    for (const row of combined) {
      if (!row.productId) continue;

      const key = `${row.productId}-${row.price}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          productId: row.productId,
          price: row.price,
        });
      }
    }

    setEndingRows((current) => {
      const currentMap = new Map(
        current.map((row) => [`${row.productId}-${row.price}`, row]),
      );

      return Array.from(grouped.values()).map((item) => {
        const key = `${item.productId}-${item.price}`;

        return (
          currentMap.get(key) ?? {
            id: `end-${key}`,
            productId: item.productId,
            qty: 0,
            price: item.price,
          }
        );
      });
    });
  }

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/routes/products", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to load product options");
        }

        const result = await response.json();
        const options = (result?.products ?? []).map(
          (product: ProductOption) => ({
            _id: product._id,
            productId: product.productId ?? product.productName ?? product._id,
            productName: product.productName ?? "",
          }),
        );

        setProducts(options);
      } catch (error) {
        console.error(error);
      }
    }

    loadProducts();
  }, []);

  const updateBeginningRows = (
    updater: React.SetStateAction<InventoryRow[]>,
  ) => {
    setBeginningRows((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;

      syncEndingRows(next, additionRows);

      return next;
    });
  };

  const updateAdditionRows = (
    updater: React.SetStateAction<InventoryRow[]>,
  ) => {
    setAdditionRows((current) => {
      const next = typeof updater === "function" ? updater(current) : updater;

      syncEndingRows(beginningRows, next);

      return next;
    });
  };

  const addBeginningRow = () => {
    updateBeginningRows((rows) => [...rows, createEmptyRow()]);
  };

  const addAdditionRow = () => {
    updateAdditionRows((rows) => [...rows, createEmptyRow()]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Submit clicked");
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    if (!transactionNumber.trim()) {
      setErrorMessage("Transaction number is required.");
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

    const cleanBeginning = beginningRows.filter(
      (r) => r.productId.trim() !== "",
    );
    const cleanAdditions = additionRows.filter(
      (r) => r.productId.trim() !== "",
    );
    const cleanEnding = endingRows.filter((r) => r.productId.trim() !== "");

    console.log({
      transactionNumber,
      periodStart,
      periodEnd,
      cleanBeginning,
      cleanAdditions,
      cleanEnding,
    });

    if (cleanBeginning.length === 0) {
      setErrorMessage(
        "At least one valid Beginning Inventory row is required.",
      );
      setIsSubmitting(false);
      return;
    }

    const hasNegativeValues = (rows: InventoryRow[]) => {
      return rows.some((row) => row.qty < 0 || row.price < 0);
    };

    if (
      hasNegativeValues(cleanBeginning) ||
      hasNegativeValues(cleanAdditions) ||
      hasNegativeValues(cleanEnding)
    ) {
      setErrorMessage("Quantities and prices cannot be negative.");
      setIsSubmitting(false);
      return;
    }

    const logPayload = {
      transactionNumber: transactionNumber.trim(),
      periodStart,
      periodEnd,
      beginningRows: cleanBeginning,
      additionRows: cleanAdditions,
      endingRows: cleanEnding,
    };

    console.log("Log payload:", logPayload);

    try {
      const response = await fetch("/routes/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(logPayload),
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok) {
        const errorValues =
          result?.errors && typeof result.errors === "object"
            ? Object.values(result.errors as Record<string, string[]>)
            : [];
        const firstError = errorValues[0]?.[0] ?? result?.message;
        throw new Error(firstError || "Failed to save sales log.");
      }

      setMessage(result?.message || "Sales log created successfully.");

      setTransactionNumber("");
      setPeriodStart("");
      setPeriodEnd("");
      setBeginningRows([createEmptyRow()]);
      setAdditionRows([createEmptyRow()]);
      setEndingRows([createEmptyRow()]);

      router.push("/logs");
    } catch (error) {
      console.error("Error during form submission:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the sales log.",
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

            <label
              htmlFor="transaction"
              className="mb-2 mt-3 font-bold text-prince-shadow/50"
            >
              Transaction Number:
            </label>
            <input
              type="text"
              id="transaction"
              value={transactionNumber}
              onChange={(e) => setTransactionNumber(e.target.value)}
              className="border border-prince-yellow rounded-md p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
          </div>

          <div className="mt-4 w-full">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={addBeginningRow}
                className="rounded-md bg-prince-green px-3 py-2 text-sm font-semibold text-white hover:bg-prince-orange"
              >
                + Add Beginning Row
              </button>
            </div>
            <LogsInventorySection
              title="Beginning Inventory"
              rows={beginningRows}
              setRows={updateBeginningRows}
              products={products}
            />
          </div>

          <div className="mt-4 w-full">
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={addAdditionRow}
                className="rounded-md bg-prince-green px-3 py-2 text-sm font-semibold text-white hover:bg-prince-orange"
              >
                + Add Addition Row
              </button>
            </div>
            <LogsInventorySection
              title="Additions to Inventory"
              rows={additionRows}
              setRows={updateAdditionRows}
              products={products}
            />
          </div>

          <div className="mt-4 w-full">
            <LogsInventorySection
              title="Sales"
              rows={endingRows}
              setRows={setEndingRows}
              products={products}
              allowProductEdit={false}
            />
          </div>

          <InventorySummary
            products={products}
            beginningRows={beginningRows}
            additionRows={additionRows}
            endingRows={endingRows}
          />

          <Button
            type="submit"
            disabled={isSubmitting}
            className="mt-4 rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 transition-colors duration-300 hover:bg-prince-orange"
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

export default SalesLogForm;
