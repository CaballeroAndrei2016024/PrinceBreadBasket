// Shared domain types for Transactions, Sales, Logs, and Reports.

export type TransactionType = "BEGINNING_INVENTORY" | "ADDITION" | "SALES";

export type TransactionRow = {
  id: string;
  productId: string;
  productName: string;
  qty: number;
  price: number;
};

export type LogRow = TransactionRow;

export type Transaction = {
  _id?: string;
  transactionNumber: string;
  transactionType: TransactionType;
  customerCode: string;
  date: string;
  rows: TransactionRow[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
};

//Sales Header type.
export type SalesHeader = {
  _id?: string;
  transactionId: string;
  transactionNumber: string;
  customerCode: string;
  date: string;
  rows: TransactionRow[];
  total: number;
  createdAt?: string;
};

export type SalesRecord = {
  _id?: string;
  transactionId: string;
  transactionNumber: string;
  customerCode: string;
  date: string;
  rows: TransactionRow[];
  total: number;
  createdAt?: string;
  updatedAt?: string;
};

export type Report = {
  _id?: string;
  transactionNumber: string;
  periodStart: string;
  periodEnd: string;
  rows: TransactionRow[];
  total: number;
  createdAt?: string;
};

// Log type.
export type Log = {
  _id?: string;
  transactionNumber: string;
  periodStart: string;
  periodEnd: string;
  beginningRows: TransactionRow[];
  additionRows: TransactionRow[];
  salesRows: TransactionRow[];
  endingRows: TransactionRow[];
  createdAt?: string;
};

export type InventoryRow = {
  id: string;
  productId: string;
  qty: number;
  price: number;
};
