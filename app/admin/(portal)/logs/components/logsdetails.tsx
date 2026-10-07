"use client";

// Mandatory imports and "use client"
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AdminLogInventoryRow, AdminSalesLog } from "@/app/admin/types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

type AdminProductOption = {
  _id?: string;
  productId: string;
  productName: string;
  productPrice: number;
};

interface LogDetailProps {
  log: AdminSalesLog;
}

function LogDetail({ log }: LogDetailProps) {
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

  const [periodStart, setPeriodStart] = useState(log.periodStart);
  const [periodEnd, setPeriodEnd] = useState(log.periodEnd);

  const [beginningRows, setBeginningRows] = useState<AdminLogInventoryRow[]>(
    log.beginningRows,
  );

  const [additionRows, setAdditionRows] = useState<AdminLogInventoryRow[]>(
    log.additionRows,
  );
  const [salesRows, setSalesRows] = useState<AdminLogInventoryRow[]>(
    log.salesRows,
  );
  const [isEditingSalesRows, setIsEditingSalesRows] = useState(false);
  const [isSavingSalesRows, setIsSavingSalesRows] = useState(false);

  const [products, setProducts] = useState<AdminProductOption[]>([]);
  const [endingRows, setEndingRows] = useState<AdminLogInventoryRow[]>(
    syncEndingRows(log.beginningRows, log.additionRows, log.endingRows),
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const beginningTotal = beginningRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  const additionTotal = additionRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  const endingTotal = endingRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  const totalAvailable = beginningRows
    .concat(additionRows)
    .reduce((sum, row) => sum + row.qty * row.price, 0);

  const salesTotal = salesRows.reduce(
    (sum, row) => sum + row.qty * row.price,
    0,
  );

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/admin/routes/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load product options");
        }

        const result = await response.json();

        const options = (result?.products ?? []).map(
          (product: AdminProductOption) => ({
            _id: product._id,
            productId: product.productId ?? product.productName ?? product._id,
            productName: product.productName ?? "",
            productPrice:
              typeof product.productPrice === "number"
                ? product.productPrice
                : Number(product.productPrice) || 0,
          }),
        );

        setProducts(options);
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    }

    loadProducts();
  }, []);

  const updateSalesQuantity = (rowId: string, qty: number) => {
    setSalesRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, qty } : row)),
    );
  };

  const deleteSalesRow = (rowId: string) => {
    setSalesRows((currentRows) =>
      currentRows.filter((row) => row.id !== rowId),
    );
  };

  const saveSalesRows = async () => {
    setIsSavingSalesRows(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("logId", log._id ?? "");
    formData.set(
      "logData",
      JSON.stringify({
        periodStart: log.periodStart,
        periodEnd: log.periodEnd,
        beginningRows: log.beginningRows,
        additionRows: log.additionRows,
        salesRows,
        endingRows: log.endingRows,
      }),
    );

    try {
      const response = await fetch("/admin/routes/logs", {
        method: "PUT",
        body: formData,
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to update Sales values.");
      }

      setIsEditingSalesRows(false);
      router.refresh();
    } catch (error) {
      console.error("Sales values update failed:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating Sales values.",
      );
    } finally {
      setIsSavingSalesRows(false);
    }
  };

  // How the Beginning Inventory works.

  const addBeginningRow = () => {
    setBeginningRows((currentRows) => [
      ...currentRows,
      {
        id: `row-${Date.now()}-${currentRows.length}`,
        productId: "",
        productName: "",
        qty: 0,
        price: 0,
      },
    ]);
  };

  const updateBeginningProduct = (rowId: string, productId: string) => {
    const selectedProduct = products.find(
      (product) => (product.productId ?? product._id) === productId,
    );

    setBeginningRows((currentRows) => {
      const nextRows = currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              productId,
              productName: selectedProduct?.productName ?? "",
              price: selectedProduct?.productPrice ?? 0,
            }
          : row,
      );

      setEndingRows((currentEnding) =>
        syncEndingRows(nextRows, additionRows, currentEnding),
      );

      return nextRows;
    });
  };

  const updateBeginningRow = (
    index: number,
    changes: Partial<Pick<AdminLogInventoryRow, "qty">>,
  ) => {
    setBeginningRows((currentRows) => {
      const nextRows = currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...changes } : row,
      );

      setEndingRows((currentEnding) =>
        syncEndingRows(nextRows, additionRows, currentEnding),
      );

      return nextRows;
    });
  };
  const removeBeginningRow = (rowId: string) => {
    setBeginningRows((currentRows) => {
      if (currentRows.length <= 1) {
        return currentRows;
      }

      const nextRows = currentRows.filter((row) => row.id !== rowId);

      setEndingRows((currentEnding) =>
        syncEndingRows(nextRows, additionRows, currentEnding),
      );

      return nextRows;
    });
  };

  // How the Additions works.

  const addAdditionRow = () => {
    setAdditionRows((currentRows) => [
      ...currentRows,
      {
        id: `row-${Date.now()}-${currentRows.length}`,
        productId: "",
        productName: "",
        qty: 0,
        price: 0,
      },
    ]);
  };

  const updateAdditionProduct = (rowId: string, productId: string) => {
    const selectedProduct = products.find(
      (product) => (product.productId ?? product._id) === productId,
    );

    setAdditionRows((currentRows) => {
      const nextRows = currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              productId,
              productName: selectedProduct?.productName ?? "",
              price: selectedProduct?.productPrice ?? 0,
            }
          : row,
      );

      setEndingRows((currentEnding) =>
        syncEndingRows(beginningRows, nextRows, currentEnding),
      );

      return nextRows;
    });
  };

  const updateAdditionRow = (
    rowId: string,
    changes: Partial<Pick<AdminLogInventoryRow, "qty">>,
  ) => {
    setAdditionRows((currentRows) => {
      const nextRows = currentRows.map((row) =>
        row.id === rowId ? { ...row, ...changes } : row,
      );

      setEndingRows((currentEnding) =>
        syncEndingRows(beginningRows, nextRows, currentEnding),
      );

      return nextRows;
    });
  };

  const removeAdditionRow = (rowId: string) => {
    setAdditionRows((currentRows) => {
      if (currentRows.length <= 1) {
        return currentRows;
      }

      const nextRows = currentRows.filter((row) => row.id !== rowId);

      setEndingRows((currentEnding) =>
        syncEndingRows(beginningRows, nextRows, currentEnding),
      );

      return nextRows;
    });
  };

  // How the Ending Inventory works.

  function syncEndingRows(
    beginning: AdminLogInventoryRow[],
    additions: AdminLogInventoryRow[],
    currentEnding: AdminLogInventoryRow[],
  ) {
    const combined = [...beginning, ...additions];

    const grouped = new Map<
      string,
      {
        productId: string;
        productName: string;
        price: number;
      }
    >();

    for (const row of combined) {
      if (!row.productId.trim()) continue;

      const key = `${row.productId}-${row.price}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          productId: row.productId,
          productName: row.productName,
          price: row.price,
        });
      }
    }

    const currentMap = new Map(
      currentEnding.map((row) => [`${row.productId}-${row.price}`, row]),
    );

    return Array.from(grouped.values()).map((item) => {
      const key = `${item.productId}-${item.price}`;

      return (
        currentMap.get(key) ?? {
          id: `end-${key}`,
          productId: item.productId,
          productName: item.productName,
          qty: 0,
          price: item.price,
        }
      );
    });
  }

  const updateEndingQuantity = (rowId: string, qty: number) => {
    setEndingRows((currentRows) =>
      currentRows.map((row) => (row.id === rowId ? { ...row, qty } : row)),
    );
  };

  // Function to update Sales Log.

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    if (!periodStart) {
      setErrorMessage("Period start date is required.");
      setIsSaving(false);
      return;
    }

    if (!periodEnd) {
      setErrorMessage("Period end date is required.");
      setIsSaving(false);
      return;
    }

    if (new Date(periodStart) > new Date(periodEnd)) {
      setErrorMessage("Period start cannot be later than period end.");
      setIsSaving(false);
      return;
    }

    const allRows = [...beginningRows, ...additionRows, ...endingRows];

    const hasBlankProduct = allRows.some((row) => !row.productId.trim());

    if (hasBlankProduct) {
      setErrorMessage("Every inventory row must have a Product ID.");
      setIsSaving(false);
      return;
    }

    const hasNegativeValues = allRows.some(
      (row) => row.qty < 0 || row.price < 0,
    );

    if (hasNegativeValues) {
      setErrorMessage("Quantities and prices cannot be negative.");
      setIsSaving(false);
      return;
    }

    const availableQuantities = new Map<string, number>();
    for (const row of [...beginningRows, ...additionRows]) {
      availableQuantities.set(
        row.productId,
        (availableQuantities.get(row.productId) ?? 0) + row.qty,
      );
    }

    if (
      endingRows.some(
        (row) => row.qty > (availableQuantities.get(row.productId) ?? 0),
      )
    ) {
      setErrorMessage("Ending inventory cannot exceed available inventory.");
      setIsSaving(false);
      return;
    }

    const formData = new FormData();

    formData.set("logId", log._id ?? "");

    formData.set(
      "logData",
      JSON.stringify({
        transactionNumber: log.transactionNumber,
        periodStart,
        periodEnd,
        beginningRows,
        additionRows,
        salesRows,
        endingRows,
      }),
    );

    try {
      const response = await fetch("/admin/routes/logs", {
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
          "Failed to update sales log.";

        throw new Error(firstError);
      }

      setIsEditing(false);
      router.push("/admin/logs");
    } catch (error) {
      console.error("Sales Log update failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the sales log.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  // Delete Sales Log

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${log.transactionNumber}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setErrorMessage(null);

    const formData = new FormData();

    // This matches your CURRENT DELETE route.
    formData.set("log-id", log._id ?? "");

    try {
      const response = await fetch("/admin/routes/logs", {
        method: "DELETE",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete sales log.");
      }

      router.push("/admin/logs");
    } catch (error) {
      console.error("Sales Log deletion failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the sales log.",
      );

      setIsDeleting(false);
    }
  }

  // The option to quit editing.

  function handleCancelEdit() {
    setIsEditing(false);

    setPeriodStart(log.periodStart);
    setPeriodEnd(log.periodEnd);
    setBeginningRows(log.beginningRows);
    setAdditionRows(log.additionRows);
    setEndingRows(log.endingRows);

    setErrorMessage(null);
    setMessage(null);
  }

  // The Actual Content.
  return (
    <section className="mx-auto w-full max-w-4xl text-center border-4 border-prince-shadow/50">
      {!isEditing ? (
        <>
          <div className="rounded-xl bg-prince-green-80 p-6">
            <h2
              className="text-2xl font-bold text-prince-shadow/50"
              style={{
                fontFamily: "var(--font-heading)",
              }}
            >
              Sales Log Details
            </h2>

            <div
              className="mt-6 flex flex-col gap-3 text-left"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              <p>
                <strong>Transaction Number:</strong>
                {prefix}
                {""} {log.transactionNumber}
              </p>

              <p>
                <strong>Period:</strong>{" "}
                {new Date(periodStart).toLocaleDateString()} -{" "}
                {new Date(periodEnd).toLocaleDateString()}
              </p>

              <p>
                <strong>Beginning Inventory Total:</strong> {currency}
                {""}
                {beginningTotal.toFixed(2)}
              </p>

              <p>
                <strong>Additions Total:</strong> {currency}
                {""}
                {additionTotal.toFixed(2)}
              </p>

              <p>
                <strong>Ending Inventory Total:</strong> {currency}
                {""}
                {endingTotal.toFixed(2)}
              </p>

              <p>
                <strong>Total Available for Sales:</strong> {currency}
                {""}
                {totalAvailable.toFixed(2)}
              </p>

              <p>
                <strong>Sales Total:</strong> {currency}
                {""}
                {salesTotal.toFixed(2)}
              </p>

              {log.createdAt && (
                <p>
                  <strong>Created At:</strong>{" "}
                  {new Date(log.createdAt).toLocaleString()}
                </p>
              )}
            </div>

            {message && (
              <p className="mt-4 font-semibold text-green-700">{message}</p>
            )}

            {errorMessage && (
              <p className="mt-4 font-semibold text-red-600">{errorMessage}</p>
            )}

            <div className="mt-6 text-left">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-bold text-prince-shadow/50">
                  Sales Values
                </h3>
                {isEditingSalesRows ? (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={saveSalesRows}
                      disabled={isSavingSalesRows}
                      className="rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange disabled:opacity-50"
                    >
                      {isSavingSalesRows ? "SAVING..." : "Save Sales"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSalesRows(log.salesRows);
                        setIsEditingSalesRows(false);
                      }}
                      disabled={isSavingSalesRows}
                      className="rounded-md bg-slate-300 px-4 py-2 font-bold text-slate-800 transition hover:bg-slate-400 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingSalesRows(true)}
                    className="rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange"
                  >
                    Edit Sales
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
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
                      {isEditingSalesRows && (
                        <th className="border border-prince-yellow p-2 text-center">
                          Action
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {salesRows.length > 0 ? (
                      salesRows.map((row) => (
                        <tr key={row.id}>
                          <td className="border border-prince-yellow p-2">
                            {row.productId}
                          </td>
                          <td className="border border-prince-yellow p-2">
                            {row.productName}
                          </td>
                          <td className="border border-prince-yellow p-2 text-center">
                            {isEditingSalesRows ? (
                              <input
                                type="number"
                                min={0}
                                value={row.qty}
                                onChange={(event) =>
                                  updateSalesQuantity(
                                    row.id,
                                    Number(event.target.value) || 0,
                                  )
                                }
                                className="w-full rounded-md border p-1 text-center"
                              />
                            ) : (
                              row.qty
                            )}
                          </td>
                          <td className="border border-prince-yellow p-2 text-center">
                            {currency} {row.price.toFixed(2)}
                          </td>
                          <td className="border border-prince-yellow p-2 text-center font-semibold">
                            {currency} {(row.qty * row.price).toFixed(2)}
                          </td>
                          {isEditingSalesRows && (
                            <td className="border border-prince-yellow p-2 text-center">
                              <button
                                type="button"
                                onClick={() => deleteSalesRow(row.id)}
                                className="rounded-md bg-prince-red px-3 py-1 text-xs font-semibold text-white hover:opacity-80"
                              >
                                Delete
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={isEditingSalesRows ? 6 : 5}
                          className="border border-prince-yellow p-4 text-center text-slate-500"
                        >
                          No Sales rows.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex justify-center gap-4">
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-md bg-prince-red px-5 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "DELETING..." : "Delete Sales Log"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <form
          onSubmit={handleUpdate}
          className="mt-6 flex flex-col gap-4 bg-prince-green-80 p-6 text-left"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          <div>
            <label
              htmlFor="transaction-number"
              className="mb-1 block font-semibold text-prince-shadow/50"
            >
              Transaction Number
            </label>
            <input
              id="transaction-number"
              type="text"
              value={log.transactionNumber}
              readOnly
              className="w-full rounded-md border bg-slate-100 p-2"
            />
          </div>

          <div>
            <label
              htmlFor="period-start"
              className="mb-1 block font-semibold text-prince-shadow/50"
            >
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
            <label
              htmlFor="period-end"
              className="mb-1 block font-semibold text-prince-shadow/50"
            >
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

          {/* Beginning Inventory */}
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-prince-shadow/50">
                Beginning Inventory
              </h3>

              <button
                type="button"
                onClick={addBeginningRow}
                className="rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange"
              >
                Add Row
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {beginningRows.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-prince-yellow bg-white p-4"
                >
                  <p className="mb-3 font-semibold">Row {index + 1}</p>

                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label
                        htmlFor={`beginning-product-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Product ID
                      </label>

                      <select
                        id={`beginning-product-${row.id}`}
                        value={row.productId}
                        onChange={(event) =>
                          updateBeginningProduct(row.id, event.target.value)
                        }
                        className="w-full rounded-md border bg-white p-2"
                        required
                      >
                        <option value="">Select a product</option>

                        {products.map((product) => {
                          const productValue =
                            product.productId ??
                            product.productName ??
                            product._id;

                          return (
                            <option key={product._id} value={productValue}>
                              {productValue} - {product.productName}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`beginning-qty-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Quantity
                      </label>

                      <input
                        id={`beginning-qty-${row.id}`}
                        type="number"
                        min="0"
                        step="1"
                        value={row.qty}
                        onChange={(event) =>
                          updateBeginningRow(index, {
                            qty: Number(event.target.value),
                          })
                        }
                        className="w-full rounded-md border p-2"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`beginning-price-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Unit Price
                      </label>

                      <span className="text-xs font-semibold text-slate-600">
                        {currency}
                      </span>

                      <input
                        id={`beginning-price-${row.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.price}
                        readOnly
                        className="w-full rounded-md border p-2"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeBeginningRow(row.id)}
                        disabled={beginningRows.length <= 1}
                        className="w-full rounded-md bg-prince-red px-4 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete Row
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-right font-semibold">
                    Row Total: {currency}
                    {""}
                    {(row.qty * row.price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-right text-lg font-bold">
              Beginning Total: {currency}
              {""}
              {beginningTotal.toFixed(2)}
            </p>
          </div>

          {/* Additions */}
          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-prince-shadow/50">
                Additions to Inventory
              </h3>

              <button
                type="button"
                onClick={addAdditionRow}
                className="rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange"
              >
                Add Row
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {additionRows.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-prince-yellow bg-white p-4"
                >
                  <p className="mb-3 font-semibold">Row {index + 1}</p>

                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label
                        htmlFor={`addition-product-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Product ID
                      </label>

                      <select
                        id={`addition-product-${row.id}`}
                        value={row.productId}
                        onChange={(event) =>
                          updateAdditionProduct(row.id, event.target.value)
                        }
                        className="w-full rounded-md border bg-white p-2"
                        required
                      >
                        <option value="">Select a product</option>

                        {products.map((product) => {
                          const productValue =
                            product.productId ??
                            product.productName ??
                            product._id;

                          return (
                            <option key={product._id} value={productValue}>
                              {productValue} - {product.productName}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor={`addition-qty-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Quantity
                      </label>

                      <input
                        id={`addition-qty-${row.id}`}
                        type="number"
                        min="0"
                        step="1"
                        value={row.qty}
                        onChange={(event) =>
                          updateAdditionRow(row.id, {
                            qty: Number(event.target.value),
                          })
                        }
                        className="w-full rounded-md border p-2"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`addition-price-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Unit Price
                      </label>

                      <span className="text-xs font-semibold text-slate-600">
                        {currency}
                      </span>

                      <input
                        id={`addition-price-${row.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.price}
                        readOnly
                        className="w-full rounded-md border p-2"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeAdditionRow(row.id)}
                        disabled={additionRows.length <= 1}
                        className="w-full rounded-md bg-prince-red px-4 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete Row
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-right font-semibold">
                    Row Total: {currency}
                    {""}
                    {(row.qty * row.price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-right text-lg font-bold">
              Additions Total: {currency}
              {""}
              {additionTotal.toFixed(2)}
            </p>
          </div>

          {/* Ending Inventory */}
          <div className="mt-4">
            <div className="mb-3">
              <h3 className="text-lg font-bold text-prince-shadow/50">
                Ending Inventory
              </h3>
            </div>

            <div className="flex flex-col gap-3">
              {endingRows.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-prince-yellow bg-white p-4"
                >
                  <p className="mb-3 font-semibold">Row {index + 1}</p>

                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <label
                        htmlFor={`ending-product-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Product ID
                      </label>

                      <input
                        id={`ending-product-${row.id}`}
                        type="text"
                        value={row.productId}
                        readOnly
                        className="w-full rounded-md border bg-slate-100 p-2"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`ending-qty-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Quantity
                      </label>

                      <input
                        id={`ending-qty-${row.id}`}
                        type="number"
                        min="0"
                        step="1"
                        value={row.qty}
                        onChange={(event) =>
                          updateEndingQuantity(
                            row.id,
                            Number(event.target.value),
                          )
                        }
                        className="w-full rounded-md border p-2"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`ending-price-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Unit Price
                      </label>

                      <span className="text-xs font-semibold text-slate-600">
                        {currency}
                      </span>

                      <input
                        id={`ending-price-${row.id}`}
                        type="number"
                        value={row.price}
                        readOnly
                        className="w-full rounded-md border bg-slate-100 p-2"
                      />
                    </div>
                  </div>

                  <p className="mt-3 text-right font-semibold">
                    Row Total: {currency}
                    {""}
                    {(row.qty * row.price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-right text-lg font-bold">
              Ending Total: {currency}
              {""}
              {endingTotal.toFixed(2)}
            </p>
          </div>

          {/* The Calculated Fields, where Sales and Total Available for Sales is calculated. */}
          <div className="mt-6 rounded-lg border border-prince-yellow bg-white p-4">
            <h3 className="text-lg font-bold text-prince-shadow/50">
              Sales Summary
            </h3>

            <div className="mt-3 space-y-2 text-right">
              <p className="font-semibold">
                Total Available for Sales: {currency}
                {""}
                {totalAvailable.toFixed(2)}
              </p>

              <p className="font-bold text-lg">
                Sales Total: {currency}
                {""}
                {salesTotal.toFixed(2)}
              </p>
            </div>
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

export default LogDetail;
