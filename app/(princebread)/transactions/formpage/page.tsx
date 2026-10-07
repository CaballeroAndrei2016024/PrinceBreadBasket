import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";
import TransactionsForm from "../components/transactionsform";

export const metadata = {
  title: "Here is the page for making your Transactions",
  description:
    "This is the page where you make your transactions in the database..",
};

export default async function TransactionsFormPage() {
  //Session getter, to make sure no one tries anything funny.
  const session = await getSession();

  if (!session) {
    redirect("/login"); // Told you.
  }
  return (
    <div>
      <TransactionsForm />
    </div>
  );
}
