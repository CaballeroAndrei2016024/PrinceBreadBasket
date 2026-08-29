import React from "react";
import ProductRegistrationFormPage from "../components/productform";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";

export const metadata = {
  title: "Here is the page for making your Products",
  description:
    "This is the page where you make your products in the database..",
};

export default async function ProductFormPage() {
  //Session getter, to make sure no one tries anything funny.
  const session = await getSession();

  if (!session) {
    redirect("/login"); // Told you.
  }
  return (
    <div>
      <ProductRegistrationFormPage />
    </div>
  );
}
