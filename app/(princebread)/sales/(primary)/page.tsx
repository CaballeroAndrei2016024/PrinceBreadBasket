import React from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/libauth";
import { getCurrentSalesHeaders } from "@/lib/business-logic-necessities/sales-headers";

import SalesHeaderList from "../components/saleslist";

import type { SalesHeader } from "../../types";

export const revalidate = 0;

async function getSales(): Promise<SalesHeader[]> {
  return getCurrentSalesHeaders();
}

export const metadata = {
  title: "Here is the page for your Sales Headers",
  description:
    "This is the page where you can see your company's sales headers.",
};

export default async function SalesPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const sales = await getSales();

  return (
    <>
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
    </>
  );
}
