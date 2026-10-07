import { notFound } from "next/navigation";
import SalesHeaderDetail from "../components/salesdetails";
import { getCurrentSalesHeaderByTransactionNumber } from "@/lib/business-logic-necessities/sales-headers";

type PageProps = {
  params: Promise<{
    transactionNumber: string;
  }>;
};

export default async function SalesHeaderPage({ params }: PageProps) {
  const { transactionNumber } = await params;

  const sales = await getCurrentSalesHeaderByTransactionNumber(
    transactionNumber.trim(),
  );

  if (!sales) {
    notFound();
  }

  return <SalesHeaderDetail sales={sales} />;
}
