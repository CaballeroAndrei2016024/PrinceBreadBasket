//Reusable types for the inventory section of the logs form.

export type ProductOption = {
  _id: string;
  productId: string;
  productName: string;
};

export type InventoryRow = {
  id: string;
  productId: string;
  qty: number;
  price: number;
};
