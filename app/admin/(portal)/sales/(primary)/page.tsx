import React from "react";
import { getCurrentSalesHeaders } from "@/lib/business-logic-necessities/sales-headers";
import { AdminSalesHeader } from "../../../types";
import AdminSalesHeaderList from "../components/saleslist";

export const revalidate = 0;

async function getSales(): Promise<AdminSalesHeader[]> {
  return getCurrentSalesHeaders();
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

        <AdminSalesHeaderList sales={sales} />
      </div>
    </div>
  );
}
