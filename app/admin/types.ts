// Shared domain types for Transactions, Sales, Logs, and Reports.

export type AdminTransactionType = "BEGINNING_INVENTORY" | "ADDITION" | "SALES";

export type AdminTransactionRow = {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  price: number;
};

export type AdminLogRow = AdminTransactionRow;

export type AdminTransaction = {
  _id?: string;
  transactionNumber: string;
  transactionType: AdminTransactionType;
  customerCode: string;
  date: string;
  rows: AdminTransactionRow[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
};

//Admin Navbar Items.
export type NavItem = {
  name: string;
  icon: string;
  href?: string;
  action?: "logout";
};

//Identify type of User.
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

//Syntax for Admin Sales Headers.

export type AdminSalesHeader = {
  _id: string;
  transactionNumber: string;
  transactionId: string;
  customerCode: string;
  date: string;
  rows: AdminTransactionRow[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
};

//Syntax for Admin Reports.
export type AdminReport = {
  _id: string;
  transactionNumber: string;
  periodStart: string;
  periodEnd: string;
  total: number;
  rows: AdminTransactionRow[];
  createdAt?: string;
  updatedAt?: string;
};

//Syntax for Admin Logs.
export type AdminLogInventoryRow = {
  id: string;
  productId: string;
  productName: string;
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
  salesRows: AdminLogInventoryRow[];
  endingRows: AdminLogInventoryRow[];

  createdAt?: string;
};
