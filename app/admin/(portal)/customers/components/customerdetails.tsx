"use client";

//Mandatory Imports and "use client"
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

//Type and Interface required for Product Details.
type CustomerImage = {
  fileName?: string;
  mimeType?: string;
  size?: number;
  data?: string;
};

interface CustomerDetailProps {
  _id: string;
  customerCode: string;
  customerName: string;
  birthDate: string;
  address: string;
  phoneNumber?: string;
  customerImage?: CustomerImage;
  createdAt?: string;
}

function CustomerDetail(props: CustomerDetailProps) {
  //Form state management.
  const [isEditing, setIsEditing] = useState(false);
  const [customerName, setCustomerName] = useState(props.customerName);
  const [birthDate, setBirthDate] = useState(props.birthDate);
  const [address, setAddress] = useState(props.address);

  const [phoneNumber, setPhoneNumber] = useState(props.phoneNumber ?? "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentImageSrc = props.customerImage?.data
    ? `data:${props.customerImage.mimeType || "image/png"};base64,${props.customerImage.data}`
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

    formData.set("customer-code", props.customerCode);
    formData.set("customer-name", customerName.trim());
    formData.set("birthdate", birthDate.trim());
    formData.set("address", address.trim());
    formData.set("phone", phoneNumber?.trim() ?? "");

    if (selectedFile) {
      formData.set("customer-image", selectedFile);
    }

    try {
      const response = await fetch("/admin/routes/customers", {
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
          errorValues[0]?.[0] ??
          result?.message ??
          "Failed to update customer.";

        throw new Error(firstError);
      }

      //What to do after update is finished.
      setIsEditing(false);
      setSelectedFile(null);
      setImagePreview(null);

      router.push("/admin/customers");
    } catch (error) {
      console.error("Customer update failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while updating the customer.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${props.customerName}"?`,
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setMessage(null);
    setErrorMessage(null);

    const formData = new FormData();
    formData.set("customer-code", props.customerCode);

    try {
      const response = await fetch("/admin/routes/customers", {
        method: "DELETE",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result?.message || "Failed to delete customer.");
      }

      router.push("/admin/customers");
    } catch (error) {
      console.error("Customer deletion failed:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong while deleting the customer.",
      );

      setIsDeleting(false);
    }
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setCustomerName(props.customerName);
    setBirthDate(props.birthDate);
    setAddress(props.address);
    setPhoneNumber(props.phoneNumber ?? "");
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
          alt={customerName}
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
            Customer Code: {props.customerCode}
          </p>

          <h1 className="mt-2 text-3xl font-bold">{props.customerName}</h1>

          <p className="mt-3 text-xl">{props.birthDate}</p>

          <p className="mt-3 text-xl">{props.address}</p>

          <p className="mt-3 text-xl">{props.phoneNumber}</p>

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
              Edit Customer
            </button>

            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-md bg-prince-red px-5 py-2 font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeleting ? "DELETING..." : "Delete Customer"}
            </button>
          </div>
        </>
      ) : (
        <form
          onSubmit={handleUpdate}
          className="mt-6 flex flex-col gap-4 text-left"
        >
          <div>
            <label htmlFor="customer-code" className="mb-1 block font-semibold">
              Customer Code
            </label>

            <input
              id="customer-code"
              type="text"
              value={props.customerCode}
              readOnly
              className="w-full rounded-md border p-2 bg-slate-100"
            />
          </div>

          <div>
            <label htmlFor="customer-name" className="mb-1 block font-semibold">
              Customer Name
            </label>

            <input
              id="customer-name"
              type="text"
              value={customerName}
              onChange={(event) => setCustomerName(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="birthdate" className="mb-1 block font-semibold">
              Birthdate
            </label>

            <input
              id="birthdate"
              type="date"
              value={birthDate}
              onChange={(event) => setBirthDate(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="address" className="mb-1 block font-semibold">
              Address
            </label>

            <input
              id="address"
              type="text"
              value={address}
              onChange={(event) => setAddress(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block font-semibold">
              Phone Number
            </label>

            <input
              id="phone"
              type="text"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              className="w-full rounded-md border p-2"
              required
            />
          </div>

          <div>
            <label
              htmlFor="customer-image"
              className="mb-1 block font-semibold"
            >
              Replace Customer Image
            </label>

            <input
              id="customer-image"
              name="customer-image"
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

export default CustomerDetail;
