import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";
import { env } from "@/lib/env";
import { getSalesClient } from "@/lib/mongodb";
import SalesHeaderList, { type SalesHeader } from "../components/saleslist";

export const revalidate = 5; //5 second revalidation.

async function getSales() {
  const client = await getSalesClient();
  const db = client.db(env.MONGODB_SALES_DB || "sales");
  const salesCollection = db.collection("sales");

  const sales = await salesCollection.find().toArray();

  return sales.map((sales) => ({
    ...sales,

    _id: sales._id?.toString?.() ?? sales._id,

    customerCode: sales.customerCode ?? "",
    customerName: sales.customerName ?? "",
    productPrice:
      typeof sales.productPrice === "number" ? sales.productPrice : 0,

    transactionNumber: sales.transactionNumber ?? "",

    date: sales.date ?? "",

    rows: Array.isArray(sales.rows) ? sales.rows : [],

    total: typeof sales.total === "number" ? sales.total : 0,

    createdAt:
      sales.createdAt instanceof Date
        ? sales.createdAt.toISOString()
        : sales.createdAt,
  })) as SalesHeader[];
}

export default async function SalesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

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
      </div>

      <SalesHeaderList sales={sales} />
    </div>
  );
}
