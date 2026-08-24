//Reusable types for the inventory section of the logs form.

export type AdminProductOption = {
  _id: string;
  productId: string;
  productName: string;
  productPrice: number;
};

export type InventoryRow = {
  id: string;
  productId: string;
  qty: number;
  price: number;
};
