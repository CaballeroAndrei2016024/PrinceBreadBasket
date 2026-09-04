"use client";

import Link from "next/link";
import { AdminReport } from "../../../types";
import AdminPrintReport from "./printreport";
import { useState } from "react";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

type ReportsListProps = {
  reports: AdminReport[];
};

const AdminReportsList = ({ reports: initialReports }: ReportsListProps) => {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );

  const prefix = settings.receiptPrefix || "PB-";
  const [reports, setReports] = useState<AdminReport[]>(initialReports);
  return (
    <div className="w-full rounded-xl border border-prince-yellow bg-prince-green-80 p-6 shadow-lg">
      <div className="mb-4 flex-col items-center justify-center">
        <h2
          className="text-xl font-bold text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Reports
        </h2>
        <span className="text-sm text-slate-700">{reports.length} item(s)</span>
      </div>
      {reports.length === 0 ? (
        <p className="text-sm text-slate-700">
          No reports have been saved yet.
        </p>
      ) : (
        <div className="flex justify-center">
          <div className="w-full overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[90px_240px_120px_120px] border-b bg-prince-shadow/50 px-4 py-3 font-semibold">
              <span>Report #</span>
              <span>Period</span>
              <span>Print?</span>
              <span>Edit?</span>
            </div>

            {reports.map((report, index) => (
              <div
                key={
                  report._id ??
                  `${report.productId}-${report.periodStart}-${report.periodEnd}`
                }
                className="grid grid-cols-[90px_240px_120px_120px] items-center border-b bg-prince-green/80 px-4 py-3"
              >
                <span>
                  {prefix}
                  {index + 1}
                </span>

                <span>
                  {new Date(report.periodStart).toLocaleDateString()} -{" "}
                  {new Date(report.periodEnd).toLocaleDateString()}
                </span>

                <AdminPrintReport report={report} />

                <Link
                  href={`/admin/reports/${report.transactionNumber}`}
                  key={report.transactionNumber}
                  className="rounded-lg border border-prince-yellow bg-white p-4 shadow-sm"
                >
                  Edit?
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
      <Link
        href="/admin/reports/formpage"
        className="
block
w-full
box-border
rounded-md
border-2
border-prince-shadow/50
bg-prince-green/50
px-[30px]
py-5
text-center
text-[20px]
text-black
hover:italic
hover:text-prince-orange
hover:font-mono
"
        style={{
          fontFamily: "var(--font-body)",
        }}
      >
        Create New Report
      </Link>
    </div>
  );
};

export default AdminReportsList;
