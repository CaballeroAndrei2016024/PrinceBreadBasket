import Link from "next/link";
import PrintSalesHeader from "./printsales";
import type { SalesHeader, Report } from "../../types";

type SalesHeaderListProps = {
  sales: SalesHeader[];
  reports: Report[];
};

const SalesHeaderList = ({ sales, reports }: SalesHeaderListProps) => {
  //Find reports.
  const reportsById = new Map(
    reports
      .filter((report) => report._id)
      .map((report) => [String(report._id), report]),
  );
  return (
    <div className="w-full rounded-xl border border-prince-yellow bg-prince-green-80 p-6 shadow-lg">
      <div className="mb-4 flex-col items-center justify-center">
        <h2
          className="text-xl font-bold text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Sales Headers
        </h2>
        <span className="text-sm text-slate-700">{sales.length} item(s)</span>
      </div>
      {sales.length === 0 ? (
        <p className="text-sm text-slate-700">
          No sales headers have been saved yet.
        </p>
      ) : (
        <div className="flex justify-center">
          <div className="w-full overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[90px_240px_120px_90px] border-b bg-prince-shadow/50 px-4 py-3 font-semibold">
              <span>CC:</span>
              <span>Name:</span>
              <span>Date</span>
              <span>Print?</span>
            </div>

            {sales.map((sale) => {
              const report = reportsById.get(String(sale.reportId));

              if (!report) {
                return (
                  <div
                    key={sale._id ?? sale.transactionNumber}
                    className="grid grid-cols-[90px_240px_120px_90px] items-center border-b px-4 py-3"
                  >
                    <span>{sale.customerCode}</span>
                    <span>{sale.customerName}</span>
                    <span>{new Date(sale.date).toLocaleDateString()}</span>
                    <span className="text-red-500">Missing Report</span>
                  </div>
                );
              }

              return (
                <div
                  key={sale._id ?? sale.transactionNumber}
                  className="grid grid-cols-[90px_240px_120px_90px] items-center border-b px-4 py-3"
                >
                  <span>{sale.customerCode}</span>

                  <span>{sale.customerName}</span>

                  <span>{new Date(sale.date).toLocaleDateString()}</span>

                  <PrintSalesHeader sales={sale} report={report} />
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Link
        href="/sales/formpage"
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
        Create New Sales Header
      </Link>
    </div>
  );
};

export default SalesHeaderList;
