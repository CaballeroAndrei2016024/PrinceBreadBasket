import React from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";
import { env } from "@/lib/env";
import { getCustomerClient } from "@/lib/mongodb";
import CustomersList, { type Customer } from "../components/customerslist";

export const revalidate = 5; //5 second revalidation.

async function getCustomers() {
  const client = await getCustomerClient();
  const db = client.db(env.MONGODB_CUSTOMERS_DB || "customers");
  const customersCollection = db.collection("customers");
  const customers = await customersCollection.find().toArray();

  return customers.map((customer) => ({
    ...customer,
    _id: customer._id?.toString?.() ?? customer._id,
    customerCode: customer.customerCode ?? "",
    customerName: customer.customerName ?? "",
    birthDate: customer.birthDate ?? "",
    address: customer.address ?? "",

    createdAt: customer.createdAt
      ? customer.createdAt.toISOString()
      : customer.createdAt,
  })) as Customer[];
}

export const metadata = {
  title: "Here is the page for your Customers",
  description: "This is the page where you can see your company's customers.",
};

export default async function ProductPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const customers = await getCustomers();

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg">
        <h1
          className="text-2xl font-bold text-prince-yellow"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Customers
        </h1>
        <p
          className="mt-2 text-sm text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          Displaying List of Customers:
        </p>
      </div>

      <CustomersList customers={customers} />
    </div>
  );
}
