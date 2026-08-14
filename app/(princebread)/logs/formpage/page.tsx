import React from "react";
import SalesLogForm from "../components/logsform";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";

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
