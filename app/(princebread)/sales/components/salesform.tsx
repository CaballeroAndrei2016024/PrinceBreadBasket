"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ProductOption = {
  _id: string;
  productId?: string;
  productName: string;
  productPrice: number;
};

type TransactionRow = {
  id: string;
  name: string;
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

  // Product selection
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");

  // Transaction rows
  const [rows, setRows] = useState<TransactionRow[]>([
    { id: "row-1", name: "", qty: 0, price: 0 },
  ]);

  // Form submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedProduct = useMemo(
    () => products.find((product) => product.productId === selectedProductId),
    [products, selectedProductId],
  );

  const displayRows = rows.map((row) => ({
    ...row,
    price: row.price === 0 ? (selectedProduct?.productPrice ?? 0) : row.price,
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

    if (rows.some((row) => !row.name.trim())) {
      setErrorMessage("All transaction rows must have a product name.");
      setIsSubmitting(false);
      return;
    }

    if (rows.some((row) => row.qty <= 0)) {
      setErrorMessage("Quantity must be greater than zero for each row.");
      setIsSubmitting(false);
      return;
    }

    // Build payload matching SalesSchema
    const salesPayload = {
      customerCode: customerCode.trim(),
      customerName: customerName.trim(),
      transactionNumber: transactionNumber.trim(),
      date,
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
      setRows([{ id: "row-1", name: "", qty: 0, price: 0 }]);
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

  //Dropdown list of products for the sales header.
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
            productPrice:
              typeof product.productPrice === "number"
                ? product.productPrice
                : Number(product.productPrice) || 0,
          }),
        );
        setProducts(options);
        if (options.length > 0) {
          setSelectedProductId(options[0].productId ?? "");
        }
      } catch (error) {
        console.error(error);
      }
    }
    loadProducts();
  }, []);

  //The syntax to add, remove, and update rows in the transaction table.

  const addRow = () => {
    setRows((currentRows) => [
      ...currentRows,
      {
        id: `row-${currentRows.length + 1}`,
        name: "",
        qty: 0,
        price: selectedProduct?.productPrice ?? 0,
      },
    ]);
  };

  const updateRow = (rowId: string, changes: Partial<TransactionRow>) => {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.id === rowId ? { ...row, ...changes } : row,
      ),
    );
  };

  const removeRow = (rowId: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
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
                      Product Name
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
                        <select
                          value={row.name}
                          onChange={(e) =>
                            updateRow(row.id, { name: e.target.value })
                          }
                          className="w-full rounded-md border border-gray-300 p-1 text-center text-slate-700"
                        >
                          <option value="">Select a product</option>
                          {products.map((product) => (
                            <option
                              key={product._id}
                              value={product.productName}
                            >
                              {product.productId} - {product.productName}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="border border-prince-yellow p-2 text-center">
                        <input
                          type="number"
                          value={row.qty}
                          onChange={(e) =>
                            updateRow(row.id, {
                              qty: parseFloat(e.target.value),
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
                          onChange={(e) =>
                            updateRow(row.id, {
                              price: parseFloat(e.target.value),
                            })
                          }
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

            <button
              type="button"
              onClick={addRow}
              className="mb-4 bg-prince-green text-white px-4 py-2 rounded-md hover:bg-prince-orange transition-colors"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              + Add Item
            </button>

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
            htmlFor="transaction"
            className="mb-2 mt-4 font-semibold text-prince-shadow text-shadow-sm"
            style={{
              fontFamily: "var(--font-heading)",
            }}
          >
            Transaction Number:
          </label>
          <input
            type="text"
            id="transaction"
            value={transactionNumber}
            onChange={(e) => setTransactionNumber(e.target.value)}
            className="w-full rounded-md border border-prince-yellow  p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            style={{
              fontFamily: "var(--font-body)",
            }}
          />

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
