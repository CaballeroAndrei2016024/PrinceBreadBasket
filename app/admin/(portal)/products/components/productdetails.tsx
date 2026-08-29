"use client";

//Mandatory Imports and "use client"
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

//Type and Interface required for Product Details.
type ProductImage = {
  fileName?: string;
  mimeType?: string;
  size?: number;
  data?: string;
};

interface ProductDetailProps {
  _id: string;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: ProductImage;
  createdAt?: string;
}

function ProductDetail(props: ProductDetailProps) {
  //Settings
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  //Form state management.
  const [isEditing, setIsEditing] = useState(false);
  const [productName, setProductName] = useState(props.productName);
  const [productPrice, setProductPrice] = useState(
    props.productPrice.toString(),
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentImageSrc = props.productImage?.data
    ? `data:${props.productImage.mimeType || "image/png"};base64,${props.productImage.data}`
    : null;

  const displayedImageSrc = imagePreview || currentImageSrc;

  //Logic for how images change.
  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setImagePreview(URL.createObjectURL(file));
    setErrorMessage(null);
  }

  //Logic that explains handling update.
  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSaving(true);
    setMessage(null);
    setErrorMessage(null);

    const formData = new FormData();

    formData.set("product-id", props.productId);
    formData.set("product-name", productName.trim());
    formData.set("product-price", productPrice);

    if (selectedFile) {
      formData.set("product-image", selectedFile);
    }

    try {
      const response = await fetch("/admin/routes/products", {
        method: "PUT",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        const errorValues =
          result?.errors && typeof result.errors === "object"
            ? Object.values(result.errors as Record<string, string[]>)
            : [];

        const firstError =
          errorValues[0]?.[0] ?? result?.message ?? "Failed to update product.";

        throw new Error(firstError);
      }

      //What to do after update is finished.
      setIsEditing(false);
      setSelectedFile(null);
      setImagePreview(null);

      router.push("/admin/products");
    } catch (error) {
      console.error("Product update failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the product.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${props.productName}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("product-id", props.productId);

    try {
      const response = await fetch("/admin/routes/products", {
        method: "DELETE",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete product.");
      }

      router.push("/admin/products");
    } catch (error) {
      console.error("Product deletion failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the product.",
      );

      setIsDeleting(false);
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setProductName(props.productName);
    setProductPrice(props.productPrice.toString());
    setSelectedFile(null);
    setImagePreview(null);
    setErrorMessage(null);
  }

  return (
    <section className="mx-auto w-full max-w-3xl text-center border-4 border-prince-shadow/50">
      {displayedImageSrc ? (
        <Image
          width={400}
          height={400}
          src={displayedImageSrc}
          alt={productName}
          className="mx-auto w-full max-w-xl rounded-lg object-cover"
        />
      ) : (
        <div className="mx-auto flex h-64 max-w-xl items-center justify-center rounded-lg bg-slate-100">
          No image available
        </div>
      )}

      {!isEditing ? (
        <>
          <p className="mt-6 text-sm text-slate-500">
            Product ID: {props.productId}
          </p>

          <h1 className="mt-2 text-3xl font-bold">{props.productName}</h1>

          <p className="mt-3 text-xl">
            {currency}
            {""}
            {props.productPrice}
          </p>

          {message && (
            <p className="mt-4 font-semibold text-green-700">{message}</p>
          )}

          {errorMessage && (
            <p className="mt-4 font-semibold text-red-600">{errorMessage}</p>
          )}

          <div className="mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={() => {
                setIsEditing(true);
                setMessage(null);
                setErrorMessage(null);
              }}
              className="rounded-md bg-prince-green px-5 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange"
            >
              Edit Product
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-prince-red px-5 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "DELETING..." : "Delete Product"}
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={handleUpdate}
          className="mt-6 flex flex-col gap-4 text-left"
        >
          <div>
            <label htmlFor="product-id" className="mb-1 block font-semibold">
              Product ID
            </label>

            <input
              id="product-id"
              type="text"
              value={props.productId}
              readOnly
              className="w-full rounded-md border p-2 bg-slate-100"
            />
          </div>

          <div>
            <label htmlFor="product-name" className="mb-1 block font-semibold">
              Product Name
            </label>

            <input
              id="product-name"
              type="text"
              value={productName}
              onChange={(event) => setProductName(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="product-price" className="mb-1 block font-semibold">
              Product Price
            </label>

            <input
              id="product-price"
              type="number"
              step="0.01"
              min="0"
              value={productPrice}
              onChange={(event) => setProductPrice(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />

            <span className="whitespace-nowrap font-semibold text-prince-shadow/50">
              {currency}
            </span>
          </div>

          <div>
            <label htmlFor="product-image" className="mb-1 block font-semibold">
              Replace Product Image
            </label>

            <input
              id="product-image"
              name="product-image"
              type="file"
              accept="image/jpeg, image/png, image/gif"
              onChange={handleImageChange}
              className="w-full"
            />
          </div>

          {message && <p className="font-semibold text-green-700">{message}</p>}

          {errorMessage && (
            <p className="font-semibold text-red-600">{errorMessage}</p>
          )}

          <div className="flex justify-center gap-4">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-prince-green px-5 py-2 font-bold text-prince-shadow/50 transition hover:bg-prince-orange disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "SAVING..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleCancelEdit}
              disabled={isSaving}
              className="rounded-md bg-slate-300 px-5 py-2 font-bold text-slate-800 transition hover:bg-slate-400 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

export default ProductDetail;
