"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";
import { createRowId } from "@/lib/utils";
import type {
  TransactionRow,
  TransactionType,
} from "@/app/(princebread)/types";

type ProductOption = {
  _id: string;
  productId?: string;
  productName: string;
  productPrice: number;
};

type CustomerOption = {
  _id: string;
  customerCode: string;
  customerName: string;
};

const TransactionsForm = () => {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );

  const currency = settings.currency || "PHP";

  //Products
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [productSearch, setProductSearch] = useState<Record<string, string>>(
    {},
  );

  //Transaction rows
  const [rows, setRows] = useState<TransactionRow[]>([
    {
      id: "row-1",
      productId: "",
      productName: "",
      qty: 0,
      price: 0,
    },
  ]);

  // Transaction header and form states.
  const [transactionNumber, setTransactionNumber] = useState(
    "Transaction Number here",
  );
  const [customerCode, setCustomerCode] = useState("");
  const [transactionType, setTransactionType] =
    useState<TransactionType>("SALES");

  // Customers
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  //Form submission state.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  // Transaction Date.
  const [transactionDate, setTransactionDate] = useState(() =>
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Manila",
    }).format(new Date()),
  );

  // Find selected product for each row.
  const displayRows = useMemo(() => {
    return rows.map((row) => ({
      ...row,
      total: row.qty * row.price,
    }));
  }, [rows]);

  // Grand total
  const grandTotal = displayRows.reduce((sum, row) => sum + row.total, 0);

  // Load products from the database.
  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch("/routes/products", {
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

  // Load customers from the database.
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
              customer.customerCode && customer.customerCode.trim(),
          )
          .map((customer: CustomerOption) => ({
            _id: customer._id,
            customerCode: customer.customerCode,
            customerName: customer.customerName ?? "",
          }));

        setCustomers(options);
      } catch (error) {
        console.error("Failed to load customers:", error);
      } finally {
        setIsLoadingCustomers(false);
      }
    }

    loadCustomers();
  }, []);

  // Add transaction row.
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

  //Find a specific product in the database, with its name and price.
  const handleProductSelect = (rowId: string, productId: string) => {
    const selectedProduct = products.find(
      (product) => product.productId === productId,
    );

    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              productId,
              productName: selectedProduct?.productName ?? "",
              price: selectedProduct?.productPrice ?? 0,
            }
          : row,
      ),
    );

    //Find Products here. Remove search once product is selected.
    setProductSearch((currentSearches) => {
      const updatedSearches = { ...currentSearches };
      delete updatedSearches[rowId];
      return updatedSearches;
    });
  };

  // Update product search text.
  const handleProductSearchChange = (rowId: string, value: string) => {
    setProductSearch((currentSearches) => ({
      ...currentSearches,
      [rowId]: value,
    }));

    // Clear the currently selected product when searching for another one.
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

  // Update transaction row.
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

  // Remove transaction row.
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

  // Submit transaction.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    if (transactionType === "SALES" && !customerCode.trim()) {
      setErrorMessage("Customer is required for Sales transactions.");
      setIsSubmitting(false);
      return;
    }

    if (!transactionDate) {
      setErrorMessage("Transaction date is required.");
      setIsSubmitting(false);
      return;
    }

    if (rows.length === 0) {
      setErrorMessage("At least one transaction row is required.");
      setIsSubmitting(false);
      return;
    }

    if (rows.some((row) => !row.productId)) {
      setErrorMessage("Please select a product for every row.");
      setIsSubmitting(false);
      return;
    }

    if (rows.some((row) => row.qty <= 0)) {
      setErrorMessage("Quantity must be greater than zero for every row.");
      setIsSubmitting(false);
      return;
    }

    // Build the payload required by TransactionSchema.
    const transactionPayload = {
      customerCode: customerCode.trim(),
      transactionType,
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

    console.log("Transaction payload:", transactionPayload);

    try {
      const response = await fetch("/routes/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionPayload),
      });

      const result = await response.json();

      console.log("Server response:", result);

      if (!response.ok) {
        const errorValues =
          result?.errors && typeof result.errors === "object"
            ? Object.values(result.errors as Record<string, string[]>)
            : [];

        const firstError = errorValues[0]?.[0] ?? result?.message;

        throw new Error(firstError || "Failed to save transaction.");
      }

      setTransactionNumber(result?.transactionNumber ?? "");
      setMessage(
        result?.transactionNumber
          ? `${result.message} (${result.transactionNumber})`
          : result?.message || "Transaction created successfully.",
      );

      setRows([
        {
          id: "row-1",
          productId: "",
          productName: "",
          qty: 0,
          price: 0,
        },
      ]);

      setCustomerCode("");

      router.push("/transactions");
    } catch (error) {
      console.error("Transaction submission failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while saving the transaction.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
            Generate Transaction Form.
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
              htmlFor="transactiontype"
              className="mb-2 font-semibold text-prince-shadow/50 "
            >
              Transaction Type:
            </label>

            <div
              id="transactiontype"
              className="flex flex-col gap-2 rounded-md border border-prince-yellow bg-white p-3 text-slate-700 md:flex-row md:gap-6"
            >
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="transactionType"
                  value="BEGINNING_INVENTORY"
                  checked={transactionType === "BEGINNING_INVENTORY"}
                  onChange={(e) =>
                    setTransactionType(
                      e.target.value as
                        | "BEGINNING_INVENTORY"
                        | "ADDITION"
                        | "SALES",
                    )
                  }
                />
                <span>Beginning Inventory</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="transactionType"
                  value="ADDITION"
                  checked={transactionType === "ADDITION"}
                  onChange={(e) =>
                    setTransactionType(
                      e.target.value as
                        | "BEGINNING_INVENTORY"
                        | "ADDITION"
                        | "SALES",
                    )
                  }
                />
                <span>Addition</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="transactionType"
                  value="SALES"
                  checked={transactionType === "SALES"}
                  onChange={(e) =>
                    setTransactionType(
                      e.target.value as
                        | "BEGINNING_INVENTORY"
                        | "ADDITION"
                        | "SALES",
                    )
                  }
                />
                <span>Sales</span>
              </label>
            </div>
            <label
              htmlFor="customercode"
              className="mb-2 mt-3 font-semibold text-prince-shadow/50"
            >
              Customer Code:
            </label>

            <select
              id="customercode"
              value={customerCode}
              onChange={(e) => setCustomerCode(e.target.value)}
              disabled={isLoadingCustomers}
              className="rounded-md border border-prince-yellow bg-white p-2 text-slate-700 focus:border-prince-green focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
            >
              <option value="">
                {isLoadingCustomers
                  ? "Loading customers..."
                  : customers.length === 0
                    ? "No customers available"
                    : "Select Customer"}
              </option>

              {customers.map((customer) => (
                <option key={customer._id} value={customer.customerCode}>
                  {customer.customerCode} - {customer.customerName}
                </option>
              ))}
            </select>
            <label
              htmlFor="transactiondate"
              className="mb-2 font-semibold text-prince-shadow/50 "
            >
              Transaction Date:
            </label>
            <input
              type="date"
              id="transactiondate"
              value={transactionDate}
              onChange={(e) => setTransactionDate(e.target.value)}
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
              readOnly
              className="rounded-md border border-prince-yellow bg-gray-100 p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />

            {/* This section is for inputting product data. */}
            <div className="mt-4 w-full rounded-lg border border-prince-yellow bg-prince-yellow/20 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2
                  className="font-bold text-2xl text-prince-red text-shadow-sm"
                  style={{
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  Transaction Items
                </h2>

                <button
                  type="button"
                  onClick={addRow}
                  className="rounded-md bg-prince-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-prince-orange"
                  style={{
                    fontFamily: "var(--font-body)",
                  }}
                >
                  + Add Item
                </button>
              </div>

              <div
                className="overflow-x-auto mb-4"
                style={{
                  fontFamily: "var(--font-body)",
                }}
              >
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

                      <th className="border border-prince-yellow p-2 text-center w-20">
                        Action
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {displayRows.map((row) => {
                      return (
                        <tr key={row.id} className="hover:bg-prince-yellow/10">
                          {/* Search for a product in the database by its ID.*/}
                          <td className="border border-prince-yellow p-2">
                            {(() => {
                              const searchTerm =
                                productSearch[row.id] ?? row.productId;
                              const normalizedSearch = searchTerm
                                .trim()
                                .toLowerCase();

                              const filteredProducts = normalizedSearch
                                ? products.filter((product) => {
                                    const productId =
                                      product.productId?.toLowerCase() ?? "";
                                    const productName =
                                      product.productName?.toLowerCase() ?? "";

                                    return (
                                      productId.includes(normalizedSearch) ||
                                      productName.includes(normalizedSearch)
                                    );
                                  })
                                : [];

                              return (
                                <div className="relative w-full">
                                  <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) =>
                                      handleProductSearchChange(
                                        row.id,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Search Product ID or Name"
                                    autoComplete="off"
                                    className="w-full rounded-md border border-gray-300 bg-white p-1 text-slate-700 focus:border-prince-green focus:outline-none"
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
                                              onMouseDown={(e) => {
                                                e.preventDefault();
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

                          {/* Product Name - Automatically set */}
                          <td className="border border-prince-yellow p-2">
                            <input
                              type="text"
                              value={row.productName}
                              readOnly
                              placeholder="Product Name"
                              className="w-full rounded-md border border-prince-yellow bg-prince-yellow/30 p-1 text-slate-700"
                            />
                          </td>

                          {/* Input Quantity here.*/}
                          <td className="border border-prince-yellow p-2 text-center">
                            <input
                              type="number"
                              value={row.qty}
                              onChange={(e) =>
                                updateQuantity(
                                  row.id,
                                  Number(e.target.value) || 0,
                                )
                              }
                              min={1}
                              className="w-full rounded-md border border-gray-300 p-1 text-slate-700 text-center"
                            />
                          </td>

                          {/* Unit Price - Automatically set */}
                          <td className="border border-prince-yellow p-2 text-center">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="0.01"
                                value={row.price}
                                readOnly
                                min="0"
                                className="w-full min-w-0 rounded-md border border-prince-yellow bg-prince-yellow/30 p-1 text-slate-700 text-center"
                              />

                              <span className="shrink-0 text-xs font-semibold text-slate-600">
                                {currency}
                              </span>
                            </div>
                          </td>

                          {/* Calculated Total.*/}
                          <td className="border border-prince-yellow p-2 text-center font-semibold">
                            {row.total > 0
                              ? `${row.total.toFixed(2)} ${currency}`
                              : `0.00 ${currency}`}
                          </td>

                          {/* Delete a transaction. */}
                          <td className="border border-prince-yellow p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeRow(row.id)}
                              className="rounded-md bg-prince-red px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Calculate the Grand Total */}
              <div
                className="flex justify-end rounded-md bg-prince-green/20 p-3"
                style={{
                  fontFamily: "var(--font-body)",
                }}
              >
                <span
                  className="text-lg font-bold text-prince-shadow"
                  style={{
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Grand Total: {currency} {grandTotal.toFixed(2)}
                </span>
              </div>
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

export default TransactionsForm;
