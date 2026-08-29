"use client";
import Link from "next/link";
import type { AdminSalesHeader } from "../../../types";
import AdminPrintSalesHeader from "./printsales";

type SalesHeaderListProps = {
  sales: AdminSalesHeader[];
};

const AdminSalesHeaderList = ({ sales }: SalesHeaderListProps) => {
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
            <div className="grid grid-cols-[90px_240px_120px_90px_120px] border-b bg-prince-shadow/50 px-4 py-3 font-semibold">
              <span>CC:</span>
              <span>Name:</span>
              <span>Date</span>
              <span>Print?</span>
              <span>Edit?</span>
            </div>

            {sales.map((sale) => {
              return (
                <div
                  key={sale._id ?? sale.transactionNumber}
                  className="grid grid-cols-[90px_240px_120px_90px_120px] items-center border-b px-4 py-3 bg-prince-green/80"
                >
                  <span>{sale.customerCode}</span>

                  <span>{sale.customerName}</span>

                  <span>{new Date(sale.date).toLocaleDateString()}</span>

                  <AdminPrintSalesHeader sales={sale} />

                  <Link
                    href={`/admin/sales/${sale.transactionNumber}`}
                    className="rounded-lg border border-prince-yellow bg-white p-4 shadow-sm"
                  >
                    Edit?
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Link
        href="/admin/sales/formpage"
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

export default AdminSalesHeaderList;
