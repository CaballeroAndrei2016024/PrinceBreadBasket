import React from "react";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/libauth";
import { env } from "@/lib/env";
import { getSalesClient, getReportsClient } from "@/lib/mongodb";

import SalesHeaderList from "../components/saleslist";

import type { SalesHeader, Report } from "../../types";

export const revalidate = 5;

async function getSales(): Promise<SalesHeader[]> {
  const client = await getSalesClient();

  const db = client.db(env.MONGODB_SALES_DB || "sales");
  const salesCollection = db.collection("sales");

  const sales = await salesCollection.find().toArray();

  return sales.map((sale) => ({
    _id: sale._id?.toString?.() ?? sale._id?.toString(),

    customerCode: sale.customerCode ?? "",

    customerName: sale.customerName ?? "",

    transactionNumber: sale.transactionNumber ?? "",

    date: sale.date ?? "",

    reportId: sale.reportId ?? "",

    createdAt:
      sale.createdAt instanceof Date
        ? sale.createdAt.toISOString()
        : sale.createdAt,
  }));
}

async function getReports(): Promise<Report[]> {
  const client = await getReportsClient();

  const db = client.db(env.MONGODB_REPORTS_DB || "reports");
  const reportsCollection = db.collection("reports");

  const reports = await reportsCollection.find().toArray();

  return reports.map((report) => ({
    _id: report._id?.toString() ?? "",

    productId: report.productId ?? "",

    productName: report.productName ?? "",

    productPrice:
      typeof report.productPrice === "number" ? report.productPrice : 0,

    transactionNumber: report.transactionNumber ?? "",

    periodStart: report.periodStart ?? "",

    periodEnd: report.periodEnd ?? "",

    rows: Array.isArray(report.rows) ? report.rows : [],

    total: typeof report.total === "number" ? report.total : 0,

    createdAt:
      report.createdAt instanceof Date
        ? report.createdAt.toISOString()
        : report.createdAt,
  }));
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
  const reports = await getReports();

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

      <SalesHeaderList sales={sales} reports={reports} />
    </>
  );
}
