"use client";

//Mandatory Imports and "use client"
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AdminReportTransactionRow } from "../../../types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

//Type and Interface required for Report Details.

interface ReportDetailProps {
  _id: string;
  transactionNumber: string;
  productId: string;
  productName: string;
  productPrice: number;
  periodStart: string;
  periodEnd: string;
  total: number;
  rows: AdminReportTransactionRow[];
  createdAt?: string;
  updatedAt?: string;
}

function ReportDetail(props: ReportDetailProps) {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  const prefix = settings.receiptPrefix || "PB-";

  //Report Details.
  const [isEditing, setIsEditing] = useState(false);
  const [productId, setProductId] = useState(props.productId);
  const [productName, setProductName] = useState(props.productName);
  const [productPrice, setProductPrice] = useState(
    props.productPrice.toString(),
  );
  const [periodStart, setPeriodStart] = useState(props.periodStart);
  const [periodEnd, setPeriodEnd] = useState(props.periodEnd);
  const [rows, setRows] = useState(props.rows);
  //Form States.
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const total = rows.reduce((sum, row) => sum + row.qty * row.price, 0);

  // Row management functions
  const addRow = () => {
    setRows((currentRows) => [
      ...currentRows,
      {
        id: `row-${Date.now()}-${currentRows.length}`,
        date: "",
        qty: 0,
        price: Number(productPrice) || 0,
      },
    ]);
  };

  const updateRow = (
    rowId: string,
    changes: Partial<AdminReportTransactionRow>,
  ) => {
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

  //Logic that explains handling update.
  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    const formData = new FormData();

    formData.set("report-id", props._id);

    formData.set(
      "report-data",
      JSON.stringify({
        transactionNumber: props.transactionNumber,
        productId: productId.trim(),
        productName: productName.trim(),
        productPrice: Number(productPrice),
        periodStart,
        periodEnd,
        total,
        rows,
      }),
    );

    try {
      const response = await fetch("/admin/routes/reports", {
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
          errorValues[0]?.[0] ?? result?.message ?? "Failed to update report.";

        throw new Error(firstError);
      }

      //What to do after update is finished.
      setIsEditing(false);

      router.push("/admin/reports");
    } catch (error) {
      console.error("Report update failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the report.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${props.transactionNumber}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("report-id", props._id);

    try {
      const response = await fetch("/admin/routes/reports", {
        method: "DELETE",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete report.");
      }

      router.push("/admin/reports");
    } catch (error) {
      console.error("Report deletion failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the report.",
      );

      setIsDeleting(false);
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);

    setProductId(props.productId);
    setProductName(props.productName);
    setProductPrice(props.productPrice.toString());
    setPeriodStart(props.periodStart);
    setPeriodEnd(props.periodEnd);
    setRows(props.rows);

    setErrorMessage(null);
  }

  return (
    <section className="mx-auto w-full max-w-3xl text-center border-4 border-prince-shadow/50">
      {!isEditing ? (
        <>
          <p>
            Transaction Number:{prefix}
            {""} {props.transactionNumber}
          </p>
          <p>Product ID: {props.productId}</p>
          <p>Product Name: {props.productName}</p>
          <p>
            Product Price:{currency}
            {""} {props.productPrice}
          </p>
          <p>
            Period: {periodStart} - {periodEnd}
          </p>
          <p>
            Total:{currency}
            {""} {total}
          </p>

          {message && (
            <p className="mt-4 font-semibold text-green-700">{message}</p>
          )}

          {errorMessage && (
            <p className="mt-4 font-semibold text-red-600">{errorMessage}</p>
          )}

          <div className="mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setMessage(null);
                setErrorMessage(null);
              }}
              className="rounded-md bg-prince-green px-5 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange"
            >
              Edit Report
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-prince-red px-5 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "DELETING..." : "Delete Report"}
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={handleUpdate}
          className="mt-6 flex flex-col gap-4 text-left"
        >
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
              value={props.transactionNumber}
              readOnly
              className="w-full rounded-md border bg-slate-100 p-2"
            />
          </div>

          <div>
            <label htmlFor="product-id" className="mb-1 block font-semibold">
              Product ID
            </label>

            <input
              id="product-id"
              type="text"
              value={productId}
              onChange={(event) => setProductId(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="product-name" className="mb-1 block font-semibold">
              Product Name
            </label>

            <input
              id="product-name"
              type="text"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="product-price" className="mb-1 block font-semibold">
              Product Price
            </label>

            <input
              id="product-price"
              type="number"
              step="0.01"
              min="0"
              value={productPrice}
              onChange={(event) => setProductPrice(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="period-start" className="mb-1 block font-semibold">
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
            <label htmlFor="period-end" className="mb-1 block font-semibold">
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

          <div className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold">Report Rows</h3>

              <button
                type="button"
                onClick={addRow}
                className="rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange"
              >
                Add Row
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {rows.map((row, index) => (
                <div
                  key={row.id}
                  className="rounded-lg border border-prince-yellow bg-white p-4"
                >
                  <p className="mb-3 font-semibold">Row {index + 1}</p>

                  <div className="grid gap-3 md:grid-cols-4">
                    <div>
                      <label
                        htmlFor={`row-date-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Date
                      </label>

                      <input
                        id={`row-date-${row.id}`}
                        type="date"
                        value={row.date}
                        onChange={(event) =>
                          updateRow(row.id, {
                            date: event.target.value,
                          })
                        }
                        className="w-full rounded-md border p-2"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`row-qty-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Quantity
                      </label>

                      <input
                        id={`row-qty-${row.id}`}
                        type="number"
                        min="0"
                        step="1"
                        value={row.qty}
                        onChange={(event) =>
                          updateRow(row.id, {
                            qty: Number(event.target.value),
                          })
                        }
                        className="w-full rounded-md border p-2"
                        required
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`row-price-${row.id}`}
                        className="mb-1 block text-sm font-semibold"
                      >
                        Unit Price
                      </label>
                      <span className="text-xs font-semibold text-slate-600">
                        {currency}
                      </span>

                      <input
                        id={`row-price-${row.id}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.price}
                        onChange={(event) =>
                          updateRow(row.id, {
                            price: Number(event.target.value),
                          })
                        }
                        className="w-full rounded-md border p-2"
                        required
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        disabled={rows.length <= 1}
                        className="w-full rounded-md bg-prince-red px-4 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Delete Row
                      </button>
                    </div>
                  </div>

                  <p className="mt-3 text-right font-semibold">
                    Row Total: {currency}
                    {(row.qty * row.price).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <p className="mt-4 text-right text-lg font-bold">
              Grand Total: {currency}
              {total.toFixed(2)}
            </p>
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

export default ReportDetail;
