export type NavItem = {
  name: string;
  icon: string;
  href?: string;
  action?: "logout";
};

export type User = {
  _id: string;
  email: string;
  username: string | null;
  role: "user" | "admin";
};

export type AdminReportTransactionRow = {
  id: string;
  date: string;
  qty: number;
  price: number;
};

export type AdminSalesHeader = {
  _id: string;
  transactionNumber: string;
  customerCode: string;
  customerName: string;
  date: string;
  productId: string;
  productName: string;
  productPrice: number;
  reportId: string;
  rows: AdminReportTransactionRow[];
  total: number;
  createdAt?: string;
};

export type AdminReport = {
  _id: string;
  transactionNumber: string;
  productId: string;
  productName: string;
  productPrice: number;
  periodStart: string;
  periodEnd: string;
  total: number;
  rows: {
    id: string;
    date: string;
    qty: number;
    price: number;
  }[];
  createdAt?: string;
  updatedAt?: string;
};

export type AdminLogInventoryRow = {
  id: string;
  productId: string;
  qty: number;
  price: number;
};

export type AdminSalesLog = {
  _id?: string;
  transactionNumber: string;
  periodStart: string;
  periodEnd: string;

  beginningRows: AdminLogInventoryRow[];
  additionRows: AdminLogInventoryRow[];
  endingRows: AdminLogInventoryRow[];

  salesPrices: Record<string, number>;

  createdAt?: string;
};
