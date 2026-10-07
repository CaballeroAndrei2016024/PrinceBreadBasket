"use client";
import Link from "next/link";
import PrintSalesHeader from "./printsales";
import type { SalesHeader } from "../../types";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

type SalesHeaderListProps = {
  sales: SalesHeader[];
};

const SalesHeaderList = ({ sales }: SalesHeaderListProps) => {
  //Settings.
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  const grandTotal = sales.reduce((sum, sale) => sum + sale.total, 0);

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
            <div className="grid grid-cols-[150px_120px_90px_120px] gap-x-4 border-b bg-prince-shadow/50 px-4 py-3 font-semibold">
              <span>Customer:</span>
              <span>Date</span>
              <span>Print?</span>
              <span>Individual Total</span>
            </div>

            {sales.map((sale) => {
              return (
                <div
                  key={sale._id ?? sale.transactionNumber}
                  className="grid grid-cols-[150px_120px_90px_120px] items-center gap-x-4 border-b px-4 py-3"
                >
                  <span>{sale.customerCode}</span>

                  <span>{new Date(sale.date).toLocaleDateString()}</span>

                  <PrintSalesHeader sales={sale} />
                  <span>
                    {currency} {""}
                    {sale.total.toFixed(2)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <p className="mt-4 text-right text-lg font-bold text-prince-shadow">
        Grand Total: {currency} {""}
        {grandTotal.toFixed(2)}
      </p>
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
