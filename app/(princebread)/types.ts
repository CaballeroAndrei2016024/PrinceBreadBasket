export type ReportTransactionRow = {
  id: string;
  date: string;
  qty: number;
  price: number;
};

export type SalesHeader = {
  _id?: string;
  transactionNumber: string;
  customerCode: string;
  customerName: string;
  date: string;
  reportId: string;
  createdAt?: string;
};

export type Report = {
  _id?: string;
  productId: string;
  productName: string;
  productPrice: number;
  transactionNumber: string;
  periodStart: string;
  periodEnd: string;
  rows: ReportTransactionRow[];
  total: number;
  createdAt?: string;
};
