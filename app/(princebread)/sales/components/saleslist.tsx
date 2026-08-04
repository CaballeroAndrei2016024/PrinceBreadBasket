import Link from "next/link";
import PrintSalesHeader from "./printsales";

export type TransactionRow = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

export type SalesHeader = {
  _id?: string;
  productId: string;
  customerCode: string;
  customerName: string;
  productPrice: number;

  transactionNumber: string;
  date: string;

  rows: TransactionRow[];

  total: number;

  createdAt?: string;
};

type SalesHeaderListProps = {
  sales: SalesHeader[];
};

const SalesHeaderList = ({ sales }: SalesHeaderListProps) => {
  return (
    <div className="w-full rounded-xl border border-prince-yellow bg-prince-green-80 p-6 shadow-lg">
      <div className="mb-4 flex-col items-center justify-center">
        <h2
          className="text-xl font-bold text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Sales Headers
        </h2>
        <span className="text-sm text-slate-700">{sales.length} item(s)</span>
      </div>
      {sales.length === 0 ? (
        <p className="text-sm text-slate-700">
          No sales headers have been saved yet.
        </p>
      ) : (
        <div className="flex justify-center">
          <div className="w-full overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[90px_240px_120px_90px] border-b bg-prince-shadow/50 px-4 py-3 font-semibold">
              <span>CC:</span>
              <span>Name:</span>
              <span>Date</span>
              <span>Print?</span>
            </div>

            {sales.map((sales, index) => (
              <div
                key={sales._id ?? sales.customerCode}
                className="grid grid-cols-[90px_240px_120px_90px] items-center border-b px-4 py-3"
              >
                <span>{sales.customerCode}</span>

                <span>{sales.customerName}</span>

                <span>{new Date(sales.date).toLocaleDateString()} </span>

                <PrintSalesHeader sales={sales} />
              </div>
            ))}
          </div>
        </div>
      )}
      <Link
        href="/sales"
        className="
block
w-full
box-border
rounded-md
border-2
border-prince-shadow/50
bg-prince-green/50
px-[30px]
py-5
text-center
text-[20px]
text-black
cursor-crosshair
hover:italic
hover:text-prince-orange
hover:font-mono
"
        style={{
          fontFamily: "var(--font-body)",
        }}
      >
        Create New Sales Header
      </Link>
    </div>
  );
};

export default SalesHeaderList;
