import { notFound } from "next/navigation";
import ReportDetail from "../components/reportdetails";
import { getCurrentSalesReportByTransactionNumber } from "@/lib/business-logic-necessities/sales-reports";

type PageProps = {
  params: Promise<{
    transactionNumber: string;
  }>;
};

export default async function ReportPage({ params }: PageProps) {
  const { transactionNumber } = await params;

  const report = await getCurrentSalesReportByTransactionNumber(
    transactionNumber.trim(),
  );

  if (!report) {
    notFound();
  }

  return <ReportDetail report={report} />;
}
