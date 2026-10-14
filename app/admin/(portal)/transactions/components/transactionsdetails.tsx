"use client";

//Mandatory Imports and "use client"
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminTransaction, AdminTransactionRow } from "../../../types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";
import { createRowId } from "@/lib/utils";

// Transaction Details

type ProductOption = {
  _id: string;
  productId?: string;
  productName: string;
  productPrice: number;
};

type Props = {
  transaction: AdminTransaction;
};

function AdminTransactionDetails({ transaction }: Props) {
  // Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );

  const currency = settings.currency || "PHP";
  const prefix = settings.receiptPrefix || "PB-";

  // Find Products
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState<Record<string, string>>(
    {},
  );

  // Edit state
  const [isEditing, setIsEditing] = useState(false);
  const transactionType = transaction.transactionType;
  const customerCode = transaction.customerCode ?? "";
  const [transactionDate, setTransactionDate] = useState(transaction.date);
  const [rows, setRows] = useState<AdminTransactionRow[]>(
    transaction.rows.map((row) => ({
      ...row,
    })),
  );

  // Request states
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Calculated rows
  const displayRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      total: row.qty * row.price,
    }));
  }, [rows]);

  // Display Grand Total.
  const grandTotal = useMemo(() => {
    return displayRows.reduce((sum, row) => sum + row.total, 0);
  }, [displayRows]);

  // Load products so Product ID can be selected from the database.
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/admin/routes/products", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load product options.");
        }

        const result = await response.json();

        const options = (result?.products ?? [])
          .filter((product: ProductOption) => product.productId)
          .map((product: ProductOption) => ({
            _id: product._id,
            productId: product.productId as string,
            productName: product.productName ?? "",
            productPrice:
              typeof product.productPrice === "number"
                ? product.productPrice
                : Number(product.productPrice) || 0,
          }));

        setProducts(options);
      } catch (error) {
        console.error("Failed to load products:", error);
      }
    }

    loadProducts();
  }, []);

  // Add row
  const addRow = () => {
    setRows((currentRows) => [
      ...currentRows,
      {
        id: createRowId(),
        productId: "",
        productName: "",
        qty: 0,
        price: 0,
      },
    ]);
  };

  // Product selection
  const handleProductSelect = (rowId: string, productId: string) => {
    const selectedProduct = products.find(
      (product) => product.productId === productId,
    );

    if (!selectedProduct) {
      return;
    }

    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              productId: selectedProduct.productId as string,
              productName: selectedProduct.productName,
              price: selectedProduct.productPrice,
            }
          : row,
      ),
    );

    setProductSearch((currentSearches) => {
      const updatedSearches = { ...currentSearches };
      delete updatedSearches[rowId];
      return updatedSearches;
    });
  };

  const handleProductSearchChange = (rowId: string, value: string) => {
    setProductSearch((currentSearches) => ({
      ...currentSearches,
      [rowId]: value,
    }));

    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              productId: "",
              productName: "",
              price: 0,
            }
          : row,
      ),
    );
  };

  // Quantity update
  const updateQuantity = (rowId: string, qty: number) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              qty,
            }
          : row,
      ),
    );
  };

  // Remove row
  const removeRow = (rowId: string) => {
    setRows((currentRows) =>
      currentRows.length > 1
        ? currentRows.filter((row) => row.id !== rowId)
        : currentRows,
    );

    setProductSearch((currentSearches) => {
      const updatedSearches = { ...currentSearches };
      delete updatedSearches[rowId];
      return updatedSearches;
    });
  };

  // Start editing
  const handleStartEdit = () => {
    setMessage(null);
    setErrorMessage(null);
    setIsEditing(true);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setIsEditing(false);
    setTransactionDate(transaction.date);

    setRows(
      transaction.rows.map((row) => ({
        ...row,
      })),
    );

    setProductSearch({});

    setMessage(null);
    setErrorMessage(null);
  };

  // Update transaction
  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    // Client-side validation
    if (transactionType === "SALES" && !customerCode.trim()) {
      setErrorMessage("Customer is required for Sales transactions.");
      setIsSaving(false);
      return;
    }

    if (!transactionDate) {
      setErrorMessage("Transaction date is required.");
      setIsSaving(false);
      return;
    }

    if (rows.length === 0) {
      setErrorMessage("At least one transaction row is required.");
      setIsSaving(false);
      return;
    }

    if (rows.some((row) => !row.productId.trim())) {
      setErrorMessage("Please select a product for every row.");
      setIsSaving(false);
      return;
    }

    if (rows.some((row) => row.qty <= 0)) {
      setErrorMessage("Quantity must be greater than zero for every row.");
      setIsSaving(false);
      return;
    }

    const transactionData = {
      transactionNumber: transaction.transactionNumber,
      transactionType,
      customerCode: customerCode.trim(),
      date: transactionDate,
      rows: displayRows.map((row) => ({
        id: row.id,
        productId: row.productId,
        productName: row.productName,
        qty: row.qty,
        price: row.price,
      })),
      total: grandTotal,
    };

    if (!transaction.transactionNumber) {
      setErrorMessage("Transaction Number is missing.");
      setIsSaving(false);
      return;
    }

    const formData = new FormData();

    // Match the PUT route for this:
    formData.set("transaction-number", transaction.transactionNumber);

    formData.set("transactions-data", JSON.stringify(transactionData));

    try {
      const response = await fetch("/admin/routes/transactions", {
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
          "Failed to update transaction.";

        throw new Error(firstError);
      }

      setMessage(result?.message ?? "Transaction updated successfully.");

      setIsEditing(false);

      router.push("/admin/transactions");
      router.refresh();
    } catch (error) {
      console.error("Transaction update failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the transaction.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete the transaction for "${transaction.transactionNumber}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setErrorMessage(null);

    const formData = new FormData();

    formData.set("transaction-number", transaction.transactionNumber);

    try {
      const response = await fetch("/admin/routes/transactions", {
        method: "DELETE",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete transaction.");
      }

      router.push("/admin/transactions");
    } catch (error) {
      console.error("Transaction deletion failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the transaction.",
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
              Transaction Details
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
              {transaction.transactionNumber}
            </p>

            <p>
              <strong>Transaction Type:</strong>{" "}
              {transaction.transactionType.replaceAll("_", " ")}
            </p>

            <p>
              <strong>Customer Code:</strong>{" "}
              {transaction.customerCode || "N/A"}
            </p>

            <p>
              <strong>Transaction Date:</strong> {transaction.date}
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
                    Qty
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
                {displayRows.map((row) => (
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
                      {currency} {row.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-right text-lg font-bold">
            Grand Total: {currency} {grandTotal.toFixed(2)}
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
              Edit Transaction
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-prince-red px-5 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "DELETING..." : "Delete Transaction"}
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
          <h2 className="text-xl font-bold text-prince-yellow">
            Edit Transaction
          </h2>

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
              value={transaction.transactionNumber}
              readOnly
              className="w-full rounded-md border bg-slate-100 p-2"
            />
          </div>

          <div>
            <p className="mb-1 font-semibold">Transaction Type</p>

            <p className="rounded-md border bg-slate-100 p-2 text-slate-700">
              {transaction.transactionType.replaceAll("_", " ")}
            </p>
          </div>

          <div>
            <label htmlFor="customer-code" className="mb-1 block font-semibold">
              Customer Code
            </label>

            <input
              id="customer-code"
              type="text"
              value={customerCode}
              readOnly
              aria-readonly="true"
              className="w-full cursor-not-allowed rounded-md border bg-slate-100 p-2 text-slate-700"
            />
          </div>

          <div>
            <label
              htmlFor="transaction-date"
              className="mb-1 block font-semibold"
            >
              Transaction Date
            </label>

            <input
              id="transaction-date"
              type="date"
              value={transactionDate}
              onChange={(event) => setTransactionDate(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Transaction Items</h3>

              <button
                type="button"
                onClick={addRow}
                className="rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange"
              >
                + Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-prince-green text-white">
                    <th className="border border-prince-yellow p-2 text-left">
                      Product
                    </th>

                    <th className="border border-prince-yellow p-2 text-left">
                      Product Name
                    </th>

                    <th className="border border-prince-yellow p-2 text-center">
                      Qty
                    </th>

                    <th className="border border-prince-yellow p-2 text-center">
                      Unit Price
                    </th>

                    <th className="border border-prince-yellow p-2 text-center">
                      Total
                    </th>

                    <th className="border border-prince-yellow p-2 text-center">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayRows.map((row) => (
                    <tr key={row.id}>
                      <td className="border border-prince-yellow p-2">
                        {(() => {
                          const searchTerm =
                            productSearch[row.id] ?? row.productId;
                          const normalizedSearch = searchTerm
                            .trim()
                            .toLowerCase();

                          const searchTerms = normalizedSearch
                            .split(/\s+/)
                            .filter(Boolean);
                          const filteredProducts = searchTerms.length
                            ? products.filter((product) => {
                                const productId =
                                  product.productId?.toLowerCase() ?? "";
                                const productName =
                                  product.productName?.toLowerCase() ?? "";

                                return searchTerms.every(
                                  (term) =>
                                    productId.includes(term) ||
                                    productName.includes(term),
                                );
                              })
                            : [];

                          return (
                            <div className="relative w-full">
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={(event) =>
                                  handleProductSearchChange(
                                    row.id,
                                    event.target.value,
                                  )
                                }
                                placeholder="Search Product ID or Name"
                                autoComplete="off"
                                className="w-full rounded-md border p-2 text-slate-700 focus:border-prince-green focus:outline-none"
                              />

                              {Object.prototype.hasOwnProperty.call(
                                productSearch,
                                row.id,
                              ) &&
                                normalizedSearch && (
                                  <div className="mt-1 max-h-48 w-full overflow-y-auto rounded-md border border-prince-yellow bg-white shadow-lg">
                                    {filteredProducts.length > 0 ? (
                                      filteredProducts.map((product) => (
                                        <button
                                          key={product._id}
                                          type="button"
                                          onMouseDown={(event) => {
                                            event.preventDefault();
                                            handleProductSelect(
                                              row.id,
                                              product.productId as string,
                                            );
                                          }}
                                          className="block w-full border-b border-gray-200 p-2 text-left text-sm text-slate-700 hover:bg-prince-yellow/20 last:border-b-0"
                                        >
                                          <span className="font-semibold">
                                            {product.productId}
                                          </span>{" "}
                                          - {product.productName}
                                        </button>
                                      ))
                                    ) : (
                                      <div className="p-2 text-sm text-slate-500">
                                        No matching products found.
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="border border-prince-yellow p-2">
                        <input
                          type="text"
                          value={row.productName}
                          readOnly
                          className="w-full rounded-md border bg-prince-yellow/20 p-2 text-slate-700"
                        />
                      </td>

                      <td className="border border-prince-yellow p-2">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={row.qty}
                          onChange={(event) =>
                            updateQuantity(
                              row.id,
                              Number(event.target.value) || 0,
                            )
                          }
                          className="w-full rounded-md border p-2 text-center text-slate-700"
                        />
                      </td>

                      <td className="border border-prince-yellow p-2 text-center">
                        {currency} {row.price.toFixed(2)}
                      </td>

                      <td className="border border-prince-yellow p-2 text-center font-semibold">
                        {currency} {row.total.toFixed(2)}
                      </td>

                      <td className="border border-prince-yellow p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          disabled={rows.length <= 1}
                          className="rounded-md bg-prince-red px-3 py-1 text-xs font-semibold text-white hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-right text-lg font-bold">
              Grand Total: {currency} {grandTotal.toFixed(2)}
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
              className="rounded-md bg-slate-300 px-5 py-2 font-bold text-slate-800 transition hover:bg-slate-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default AdminTransactionDetails;
