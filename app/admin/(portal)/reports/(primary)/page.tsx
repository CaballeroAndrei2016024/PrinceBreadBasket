import React from "react";
import { env } from "@/lib/env";
import { getReportsClient } from "@/lib/mongodb";
import ReportsList from "../components/reportslist";
import { AdminReport } from "../../../types";

export const revalidate = 5; //5 second revalidation.

async function getReports() {
  const client = await getReportsClient();
  const db = client.db(env.MONGODB_REPORTS_DB || "reports");
  const reportsCollection = db.collection("reports");

  const reports = await reportsCollection.find().toArray();
  return reports.map((report) => ({
    ...report,

    _id: report._id?.toString?.() ?? report._id,

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
  })) as AdminReport[];
}

export const metadata = {
  title: "Here is the page for your Sales Reports",
  description:
    "This is the page where you can see your company's sales reports. You can also choose to edit or delete them.",
};

export default async function AdminReportsPage() {
  const reports = await getReports();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg">
        <h1
          className="text-2xl font-bold text-prince-yellow"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Reports
        </h1>
        <p
          className="mt-2 text-sm text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          Displaying List of Reports:
        </p>
        <ReportsList reports={reports} />
      </div>
    </div>
  );
}
