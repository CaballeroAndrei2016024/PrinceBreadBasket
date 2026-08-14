import React from "react";
import SalesHeaderForm from "../components/salesform";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";

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
