import React from "react";
import Image from "next/image";
import Link from "next/link";

type ProductImage = {
  fileName?: string;
  mimeType?: string;
  size?: number;
  data?: string;
};

export type AdminProduct = {
  _id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: ProductImage;
  createdAt?: string;
};

type ProductsListProps = {
  products: AdminProduct[];
};

const AdminProductsList = ({ products }: ProductsListProps) => {
  return (
    <div className="w-full rounded-xl border border-prince-yellow bg-prince-green-80 p-6 shadow-lg">
      <div className="mb-4 flex-col items-center justify-center">
        <h2
          className="text-xl font-bold text-prince-shadow/50"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Products
        </h2>
        <span className="text-sm text-slate-700">
          {products.length} item(s)
        </span>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-slate-700">
          No products have been saved yet.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {products.map((product) => {
            const imageData = product.productImage?.data;
            const imageSrc = imageData
              ? `data:${product.productImage?.mimeType || "image/png"};base64,${imageData}`
              : null;

            return (
              <Link
                href={`/admin/products/${product.productId}`}
                key={product._id}
                className="rounded-lg border border-prince-yellow bg-white p-4 shadow-sm"
              >
                {product.productId && (
                  <div className="mb-2 text-xs text-slate-500">
                    ID: {product.productId}
                  </div>
                )}
                {imageSrc ? (
                  <Image
                    width={200}
                    height={200}
                    src={imageSrc}
                    alt={product.productName}
                    className="mb-3 h-40 w-full rounded-md object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-md bg-slate-100 text-sm text-slate-500">
                    No image available
                  </div>
                )}

                <h3 className="text-lg font-semibold text-prince-shadow/50">
                  {product.productName}
                </h3>
                <p className="mt-1 text-sm text-slate-700">
                  Price:{" "}
                  {new Intl.NumberFormat("en-PH", {
                    style: "currency",
                    currency: "PHP",
                  }).format(product.productPrice)}
                </p>
              </Link>
            );
          })}
        </div>
      )}
      <Link
        href="/admin/products"
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
        Create New Product
      </Link>
    </div>
  );
};

export default AdminProductsList;
