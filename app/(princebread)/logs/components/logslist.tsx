"use client";

import Link from "next/link";
import PrintSalesLog from "./printlogs";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

export type InventoryRow = {
  id: string;
  productId: string;
  qty: number;
  price: number;
};

export type SalesLog = {
  _id?: string;
  transactionNumber: string;
  periodStart: string;
  periodEnd: string;

  beginningRows: InventoryRow[];
  additionRows: InventoryRow[];
  endingRows: InventoryRow[];

  salesPrices: Record<string, number>;

  createdAt?: string;
};

export type SalesLogListProps = {
  logs: SalesLog[];
};

const SalesLogsList = ({ logs }: SalesLogListProps) => {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const prefix = settings.receiptPrefix || "PB-";
  return (
    <div className="w-full rounded-xl border border-prince-yellow bg-prince-green-80 p-6 shadow-lg">
      <div className="mb-4 flex-col items-center justify-center">
        <h2
          className="text-xl font-bold text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Sales Logs
        </h2>
        <span className="text-sm text-slate-700">{logs.length} item(s)</span>
      </div>
      {logs.length === 0 ? (
        <p className="text-sm text-slate-700">
          No sales logs have been saved yet.
        </p>
      ) : (
        <div className="flex justify-center">
          <div className="w-full overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[90px_240px_120px] border-b bg-prince-shadow/50 px-4 py-3 font-semibold">
              <span>Transaction #</span>
              <span>Period</span>
              <span>Print?</span>
            </div>

            {logs.map((log, index) => (
              <div
                key={log._id ?? log.transactionNumber}
                className="grid grid-cols-[90px_240px_120px] items-center border-b px-4 py-3"
              >
                <span>
                  {prefix}
                  {log.transactionNumber}
                </span>

                <span>
                  {new Date(log.periodStart).toLocaleDateString()} -{" "}
                  {new Date(log.periodEnd).toLocaleDateString()}
                </span>

                <PrintSalesLog log={log} />
              </div>
            ))}
          </div>
        </div>
      )}
      <Link
        href="/logs/formpage"
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
        Create New Sales Log
      </Link>
    </div>
  );
};

export default SalesLogsList;
