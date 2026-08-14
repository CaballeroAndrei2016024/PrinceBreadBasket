import Link from "next/link";
import PrintReport from "../components/printreport";
import type { Report } from "../../types";

type ReportsListProps = {
  reports: Report[];
};

const ReportsList = ({ reports }: ReportsListProps) => {
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
            <div className="grid grid-cols-[90px_240px_120px] border-b bg-prince-shadow/50 px-4 py-3 font-semibold">
              <span>Report #</span>
              <span>Period</span>
              <span>Print?</span>
            </div>

            {reports.map((report, index) => (
              <div
                key={
                  report._id ??
                  `${report.productId}-${report.periodStart}-${report.periodEnd}`
                }
                className="grid grid-cols-[90px_240px_120px] items-center border-b px-4 py-3"
              >
                <span>{index + 1}</span>

                <span>
                  {new Date(report.periodStart).toLocaleDateString()} -{" "}
                  {new Date(report.periodEnd).toLocaleDateString()}
                </span>

                <PrintReport report={report} />
              </div>
            ))}
          </div>
        </div>
      )}
      <Link
        href="/reports/formpage"
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
cursor-crosshair
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

export default ReportsList;
