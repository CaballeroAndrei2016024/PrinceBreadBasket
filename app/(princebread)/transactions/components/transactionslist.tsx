"use client";

import Link from "next/link";
import PrintTransactions from "./printtransactions";

import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";
import type { Transaction } from "../../types";

export type TransactionsListProps = {
  transactions: Transaction[];
};

const TransactionsList = ({ transactions }: TransactionsListProps) => {
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
          Transactions
        </h2>
        <span className="text-sm text-slate-700">
          {transactions.length} item(s)
        </span>
      </div>
      {transactions.length === 0 ? (
        <p className="text-sm text-slate-700">
          No transactions have been saved yet.
        </p>
      ) : (
        <div className="flex justify-center">
          <div className="w-full overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[120px_300px_240px_120px_120px] border-b bg-prince-shadow/50 px-4 py-3 font-semibold">
              <span>Transaction #</span>
              <span>Transaction Type</span>
              <span>Date</span>
              <span>Print?</span>
              <span>Edit?</span>
            </div>

            {transactions.map((transaction, index) => (
              <div
                key={transaction._id ?? `${transaction.date}-${index}`}
                className="grid grid-cols-[120px_300px_240px_120px_120px] items-center border-b px-4 py-3"
              >
                <span>
                  {prefix}
                  {transaction.transactionNumber}
                </span>

                <span>{transaction.transactionType}</span>

                <span>{transaction.date}</span>

                <PrintTransactions transaction={transaction} />

                <Link
                  href={`/transactions/${transaction.transactionNumber}`}
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
        href="/transactions/formpage"
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
        Create New Transaction
      </Link>
    </div>
  );
};

export default TransactionsList;
