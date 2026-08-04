"use client";
//The logic for dictating how each individual row in the inventory section should behave.
import React from "react";
import type { InventoryRow, ProductOption } from "./inventory.types";

type InventoryRowItemProps = {
  row: InventoryRow;
  products: ProductOption[];

  allowProductEdit?: boolean;

  onProductChange: (productId: string) => void;
  onQtyChange: (qty: number) => void;
  onPriceChange: (price: number) => void;
  onRemove: () => void;
};

const InventoryRowItem = ({
  row,
  products,
  allowProductEdit = true,
  onProductChange,
  onQtyChange,
  onPriceChange,
  onRemove,
}: InventoryRowItemProps) => {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-prince-shadow/10 bg-white/90 p-3 md:flex-row md:items-center">
      {/* Product List, based on Products already in the database. */}
      <div className="w-full md:w-2/5">
        <select
          value={row.productId}
          disabled={!allowProductEdit}
          onChange={(e) => onProductChange(e.target.value)}
          className="w-full rounded-md border border-prince-yellow bg-white px-2 py-1 text-sm"
        >
          <option value="">Select Product</option>

          {products.map((product, index) => {
            const optionKey =
              product._id ||
              `${product.productId}-${product.productName}-${index}`;

            return (
              <option key={optionKey} value={product.productId}>
                {product.productId} - {product.productName}
              </option>
            );
          })}
        </select>
      </div>

      <div className="w-full md:w-1/5">
        <input
          type="number"
          min={0}
          value={row.qty}
          onChange={(e) => onQtyChange(Number(e.target.value))}
          className="w-full rounded-md border border-prince-yellow bg-white px-2 py-1 text-sm"
        />
      </div>

      <div className="w-full md:w-1/5">
        <input
          type="number"
          min={0}
          step="0.01"
          value={row.price}
          readOnly={!allowProductEdit}
          onChange={(e) => {
            if (allowProductEdit) {
              onPriceChange(Number(e.target.value));
            }
          }}
          className={`w-full rounded-md border border-prince-yellow px-2 py-1 text-sm ${
            allowProductEdit ? "bg-white" : "bg-prince-yellow/30"
          }`}
        />
      </div>
      <div className="w-full md:w-1/5">
        <input
          readOnly
          value={(row.qty * row.price).toFixed(2)}
          className="w-full rounded-md border border-prince-yellow bg-prince-yellow/30 px-2 py-1 text-sm"
        />
      </div>

      {/* Button to remove a row. */}
      <div className="w-full md:w-auto">
        <button
          type="button"
          onClick={onRemove}
          className="w-full rounded-md bg-prince-red px-3 py-2 text-white hover:bg-red-600"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default InventoryRowItem;
