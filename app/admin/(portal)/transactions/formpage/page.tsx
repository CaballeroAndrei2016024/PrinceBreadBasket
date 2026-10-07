import React from "react";
import AdminTransactionForm from "../components/transactionsform";

export const metadata = {
  title: "Here is the page for making your Transactions",
  description:
    "This is the page where you make your transactions in the database..",
};

export default async function AdminTransactionsFormPage() {
  return (
    <div>
      <AdminTransactionForm />
    </div>
  );
}
