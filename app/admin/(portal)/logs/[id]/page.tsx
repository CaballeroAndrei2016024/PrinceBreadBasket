import { notFound } from "next/navigation";
import LogDetail from "../components/logsdetails";
import { getCurrentSalesLogById } from "@/lib/business-logic-necessities/sales-logs";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function LogPage({ params }: PageProps) {
  const { id } = await params;
  const log = await getCurrentSalesLogById(id);

  if (!log) {
    notFound();
  }

  return <LogDetail log={log} />;
}
