import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";
import { getCurrentSalesReports } from "@/lib/business-logic-necessities/sales-reports";
import ReportsList from "../components/reportslist";

export const revalidate = 5; //5 second revalidation.

//Get reports using the current state of the sales headers.
async function getReports() {
  return getCurrentSalesReports();
}

export const metadata = {
  title: "Here is the page for your Sales Reports",
  description:
    "This is the page where you can see your company's sales reports.",
};

export default async function ReportsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

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
      </div>

      <ReportsList reports={reports} />
    </div>
  );
}
