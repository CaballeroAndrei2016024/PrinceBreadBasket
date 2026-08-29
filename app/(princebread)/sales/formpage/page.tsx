import React from "react";
import SalesHeaderForm from "../components/salesform";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";

export const metadata = {
  title: "Here is the page for making your Sales Headers",
  description:
    "This is the page where you make your sales headers in the database..",
};

export default async function SalesFormPage() {
  //Session getter, to make sure no one tries anything funny.
  const session = await getSession();

  if (!session) {
    redirect("/login"); // Told you.
  }
  return (
    <div>
      <SalesHeaderForm />
    </div>
  );
}
