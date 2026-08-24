"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type ProductOption = {
  _id: string;
  productId?: string;
  productName: string;
  productPrice: number;
};

type TransactionRow = {
  id: string;
  date: string;
  qty: number;
  price: number;
};

const AdminSalesReportForm = () => {
  const router = useRouter();

  // Form header fields
  const [selectedProductId, setSelectedProductId] = useState("");
  const [transactionNumber, setTransactionNumber] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  // Product selection
  const [products, setProducts] = useState<ProductOption[]>([]);

  // Transaction rows
  const [rows, setRows] = useState<TransactionRow[]>([
    { id: "row-1", date: "", qty: 0, price: 0 },
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

    if (!selectedProduct) {
      setErrorMessage("Please select a product before submitting the report.");
      setIsSubmitting(false);
      return;
    }

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

    if (rows.length === 0) {
      setErrorMessage("At least one transaction row is required.");
      setIsSubmitting(false);
      return;
    }

    if (rows.some((row) => row.date.trim() === "")) {
      setErrorMessage("All transaction rows must include a date.");
      setIsSubmitting(false);
      return;
    }

    if (rows.some((row) => row.qty <= 0)) {
      setErrorMessage("Quantity must be greater than zero for each row.");
      setIsSubmitting(false);
      return;
    }

    const reportPayload = {
      productId: selectedProduct.productId ?? selectedProduct._id,
      productName: selectedProduct.productName,
      productPrice: selectedProduct.productPrice,
      transactionNumber: transactionNumber.trim(),
      periodStart,
      periodEnd,
      rows: displayRows,
      total: grandTotal,
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
      setRows([{ id: "row-1", date: "", qty: 0, price: 0 }]);
      setTransactionNumber("");
      setPeriodStart("");
      setPeriodEnd("");
      router.push("/admin/reports");
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

  // Load products from database
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

  // Row management functions
  const addRow = () => {
    setRows((currentRows) => [
      ...currentRows,
      {
        id: `row-${currentRows.length + 1}`,
        date: "",
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
    setRows((currentRows) =>
      currentRows.length > 1
        ? currentRows.filter((row) => row.id !== rowId)
        : currentRows,
    );
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
              htmlFor="product-id"
              className="mb-2 font-semibold text-prince-shadow/50"
            >
              Product Code:
            </label>
            <select
              id="product-id"
              name="productId"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="rounded-md border border-prince-yellow p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            >
              {products.map((product) => (
                <option
                  key={product._id}
                  value={product.productId ?? product._id}
                >
                  {product.productId} - {product.productName}
                </option>
              ))}
            </select>
            <label
              htmlFor="transaction"
              className="mt-4 mb-2 font-semibold text-prince-shadow/50"
            >
              Transaction Number:
            </label>
            <input
              type="text"
              id="transaction"
              value={transactionNumber}
              onChange={(e) => setTransactionNumber(e.target.value)}
              className="rounded-md border border-prince-yellow p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
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
          </div>

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

              <button
                type="button"
                onClick={addRow}
                className="rounded-md bg-prince-green px-4 py-2 text-sm font-semibold text-white hover:bg-prince-orange transition-colors"
                style={{
                  fontFamily: "var(--font-body)",
                }}
              >
                + Add Item
              </button>
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
                      Trans. Date
                    </th>

                    <th className="border border-prince-yellow p-2 text-center w-28">
                      Product Qty
                    </th>

                    <th className="border border-prince-yellow p-2 text-center w-32">
                      Product Price
                    </th>

                    <th className="border border-prince-yellow p-2 text-center w-32">
                      Total
                    </th>

                    <th className="border border-prince-yellow p-2 text-center w-24">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {displayRows.map((row) => (
                    <tr key={row.id} className="hover:bg-prince-yellow/10">
                      <td className="border border-prince-yellow p-2">
                        <input
                          type="date"
                          value={row.date}
                          onChange={(e) =>
                            updateRow(row.id, { date: e.target.value })
                          }
                          className="w-full rounded-md border border-gray-300 p-1 text-center text-slate-700"
                        />
                      </td>

                      <td className="border border-prince-yellow p-2">
                        <input
                          type="number"
                          value={row.qty}
                          min={0}
                          onChange={(e) =>
                            updateRow(row.id, {
                              qty: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-md border border-gray-300 p-1 text-center text-slate-700"
                        />
                      </td>

                      <td className="border border-prince-yellow p-2">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={row.price}
                          onChange={(e) =>
                            updateRow(row.id, {
                              price: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-md border border-gray-300 p-1 text-center text-slate-700"
                        />
                      </td>

                      <td className="border border-prince-yellow p-2 text-center font-semibold">
                        {(row.qty * row.price).toFixed(2)}
                      </td>

                      <td className="border border-prince-yellow p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="rounded-md bg-prince-red px-2 py-1 text-xs font-semibold text-white hover:bg-red-600"
                        >
                          Remove
                        </button>
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
              <span className="font-semibold">₱{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Error Message */}
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

          {/* Success Message */}
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

          {/* Submit Button */}
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

export default AdminSalesReportForm;

//Yes, I intentioanlly want to store the buisness PID for the Product, not MongoDB's ID.
