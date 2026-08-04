import React from "react";
//Component Logic for Beginning Inventory, Additions, and Ending Inventory.
import type { InventoryRow, ProductOption } from "./inventory.types";
import InventoryRowItem from "./inventoryrow";

type LogsInventorySectionProps = {
  title: string;
  rows: InventoryRow[];
  setRows: React.Dispatch<React.SetStateAction<InventoryRow[]>>;
  products: ProductOption[];
  allowProductEdit?: boolean;
};

const LogsInventorySection = ({
  title,
  rows,
  setRows,
  products,
  allowProductEdit = true,
}: LogsInventorySectionProps) => {
  const grandTotal = rows.reduce((sum, row) => sum + row.qty * row.price, 0);
  return (
    <div className="mt-4 w-full rounded-lg border border-prince-yellow bg-prince-yellow/20 p-4">
      <h1
        className="font-bold text-2xl text-prince-red text-shadow-sm"
        style={{
          fontFamily: "var(--font-heading)",
        }}
      >
        {title}
      </h1>

      <div
        className="mt-4 space-y-3"
        style={{
          fontFamily: "var(--font-body)",
        }}
      >
        {rows.map((row) => (
          <InventoryRowItem
            key={row.id}
            row={row}
            products={products}
            allowProductEdit={allowProductEdit}
            onProductChange={(productId) =>
              setRows((current) =>
                current.map((r) => (r.id === row.id ? { ...r, productId } : r)),
              )
            }
            onQtyChange={(qty) =>
              setRows((current) =>
                current.map((r) => (r.id === row.id ? { ...r, qty } : r)),
              )
            }
            onPriceChange={(price) =>
              setRows((current) =>
                current.map((r) => (r.id === row.id ? { ...r, price } : r)),
              )
            }
            onRemove={() =>
              setRows((current) => current.filter((r) => r.id !== row.id))
            }
          />
        ))}
        {/* Grand Total */}
        <div className="mt-4 flex justify-end">
          <div className="w-full md:w-1/4">
            <label className="mb-1 block text-right font-bold">
              Grand Total
            </label>

            <input
              readOnly
              value={grandTotal.toFixed(2)}
              className="w-full rounded-md border border-prince-yellow bg-prince-green/20 px-2 py-2 text-right font-bold"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsInventorySection;
