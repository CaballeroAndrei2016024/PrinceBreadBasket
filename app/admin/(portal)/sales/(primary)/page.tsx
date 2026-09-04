import React from "react";
import { env } from "@/lib/env";
import { getSalesClient } from "@/lib/mongodb";

import SalesHeaderList from "../components/saleslist";
import { AdminSalesHeader } from "../../../types";

export const revalidate = 5;

async function getSales(): Promise<AdminSalesHeader[]> {
  const client = await getSalesClient();

  const db = client.db(env.MONGODB_SALES_DB || "sales");
  const salesCollection = db.collection("sales");

  const sales = await salesCollection.find().toArray();

  return sales.map((sale) => ({
    _id: sale._id?.toString() ?? "",

    transactionNumber: sale.transactionNumber ?? "",

    customerCode: sale.customerCode ?? "",

    date:
      sale.date instanceof Date
        ? sale.date.toISOString().split("T")[0]
        : (sale.date ?? ""),

    reportId: sale.reportId ?? "",
    reportTransaction: sale.reportTransaction ?? "",

    productId: sale.productId ?? "",
    productName: sale.productName ?? "",

    productPrice: typeof sale.productPrice === "number" ? sale.productPrice : 0,

    periodStart:
      sale.periodStart instanceof Date
        ? sale.periodStart.toISOString().split("T")[0]
        : (sale.periodStart ?? ""),

    periodEnd:
      sale.periodEnd instanceof Date
        ? sale.periodEnd.toISOString().split("T")[0]
        : (sale.periodEnd ?? ""),

    rows: Array.isArray(sale.rows) ? sale.rows : [],

    total: typeof sale.total === "number" ? sale.total : 0,

    createdAt:
      sale.createdAt instanceof Date
        ? sale.createdAt.toISOString()
        : sale.createdAt,

    updatedAt:
      sale.updatedAt instanceof Date
        ? sale.updatedAt.toISOString()
        : sale.updatedAt,
  }));
}

export const metadata = {
  title: "Here is the page for your Sales Headers",
  description:
    "This is the page where you can see your company's sales headers. You can also choose to edit or delete them.",
};

export default async function AdminSalesPage() {
  const sales = await getSales();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg">
        <h1
          className="text-2xl font-bold text-prince-yellow"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Sales Headers
        </h1>

        <p
          className="mt-2 text-sm text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          Displaying List of Sales Headers:
        </p>

        <SalesHeaderList sales={sales} />
      </div>
    </div>
  );
}
