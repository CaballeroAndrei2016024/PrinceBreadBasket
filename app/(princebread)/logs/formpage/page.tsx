import React from "react";
import SalesLogForm from "../components/logsform";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";

export const metadata = {
  title: "Here is the page for making your Sales Logs",
  description:
    "This is the page where you make your sales logs in the database..",
};

export default async function LogFormPage() {
  //Session getter, to make sure no one tries anything funny.
  const session = await getSession();

  if (!session) {
    redirect("/login"); // Told you.
  }
  return (
    <div>
      <SalesLogForm />
    </div>
  );
}
