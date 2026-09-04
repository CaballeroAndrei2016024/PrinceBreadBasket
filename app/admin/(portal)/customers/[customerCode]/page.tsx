import { notFound } from "next/navigation";
import CustomerDetail from "../components/customerdetails";
import { env } from "@/lib/env";
import { getCustomerClient } from "@/lib/mongodb";

type PageProps = {
  params: Promise<{
    customerCode: string;
  }>;
};

//The customer info as shown by the admin module.
type CustomerRecord = {
  _id?: { toString?: () => string } | string;
  customerCode?: string;
  customerName?: string;
  birthDate?: string;
  address?: string;
  phoneNumber?: string;
  customerImage?: {
    fileName?: string;
    mimeType?: string;
    size?: number;
    data?: string;
  };
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

//Find a customer by its customerCode.
async function getCustomerById(customerCode: string) {
  //Client check.
  const client = await getCustomerClient();
  if (!client) {
    throw new Error("Database client is null. Connection failed.");
  }

  const db = client.db(env.MONGODB_CUSTOMERS_DB || "customers");
  const customer = (await db
    .collection("customers")
    .findOne({ customerCode })) as CustomerRecord | null;

  if (!customer) {
    return null;
  }

  return {
    ...customer,
    _id: customer._id?.toString?.() ?? "",
    customerCode: customer.customerCode ?? "",
    customerName: customer.customerName ?? "",
    birthDate: customer.birthDate ?? "",
    address: customer.address ?? "",
    phoneNumber: customer.phoneNumber ?? "",
    customerImage: customer.customerImage,
    createdAt:
      customer.createdAt instanceof Date
        ? customer.createdAt.toISOString()
        : (customer.createdAt ?? ""),
    updatedAt:
      customer.updatedAt instanceof Date
        ? customer.updatedAt.toISOString()
        : (customer.updatedAt ?? ""),
  };
}

export default async function CustomerPage({ params }: PageProps) {
  const { customerCode } = await params;
  const customer = await getCustomerById(customerCode.trim());

  if (!customer) {
    notFound();
  }

  return (
    <CustomerDetail
      _id={customer._id}
      customerCode={customer.customerCode}
      customerName={customer.customerName}
      birthDate={customer.birthDate}
      address={customer.address}
      phoneNumber={customer.phoneNumber}
      customerImage={customer.customerImage}
      createdAt={customer.createdAt}
    />
  );
}
