"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

const ProductRegistrationForm = () => {
  //Settings.
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const currency = settings.currency || "PHP";
  //Use States and Submission checks.
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  //Function to handle image submission.
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setImagePreview(imageUrl);
      setFileName(file.name);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submission started");

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const fileInput = formElement.elements.namedItem(
      "product-image",
    ) as HTMLInputElement | null;

    if (!fileInput?.files?.[0]) {
      setErrorMessage("Please upload an image file.");
      setIsSubmitting(false);
      return;
    }

    // Clear the formData and rebuild it with the file
    formData.set("product-image", fileInput.files[0]);

    console.log("Submitting form to /routes/products");

    try {
      // Debug: log form data entries to ensure product-id is included
      try {
        console.log("FormData entries:", Array.from(formData.entries()));
      } catch (e) {}

      const response = await fetch("/routes/products", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      console.log("Server response:", result);

      if (!response.ok) {
        const errorValues =
          result?.errors && typeof result.errors === "object"
            ? Object.values(result.errors as Record<string, string[]>)
            : [];
        const firstError = errorValues[0]?.[0] ?? result?.message;
        throw new Error(firstError || "Failed to save product.");
      }

      setMessage(result?.message || "Product created successfully.");
      formElement.reset();
      setImagePreview(null);
      setFileName(null);
      router.push("/products");
    } catch (error) {
      console.error("Form error:", error);
      setErrorMessage(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    //Actual Form Syntax.
    <div className="flex flex-col flex-1 w-full font-sans">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-6 py-10 text-center md:px-20 space-y-8">
        <div className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg text-prince-shadow/50">
          <h1
            className="font-bold text-2xl text-prince-yellow text-shadow-sm"
            style={{
              fontFamily: "var(--font-heading)",
            }}
          >
            Add Products
          </h1>
        </div>
        <form
          onSubmit={handleSubmit}
          method="POST"
          className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow border-2 bg-prince-green-80 p-6 shadow-lg"
        >
          {/*Product Image Section */}
          <div className="flex flex-col w-full text-left">
            <label
              htmlFor="product-image"
              className="mb-2 font-semibold text-prince-shadow/50 text-shadow-sm"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              Upload Product Image
            </label>

            <div
              className="flex items-center gap-4"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              <input
                type="file"
                id="product-image"
                name="product-image"
                accept="image/jpg, image/jpeg, image/png, image/gif"
                onChange={handleImageChange}
                className="hidden"
              />

              <label
                htmlFor="product-image"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 shadow-md transition hover:bg-prince-orange"
              >
                Choose File
              </label>

              <span className="text-sm text-slate-700">
                {fileName ?? "No file chosen"}
              </span>
            </div>
          </div>
          {imagePreview && (
            <div className="flex flex-col items-center mt-4">
              <p className="mb-2 text-sm font-semibold text-prince-shadow/50 text-shadow-sm">
                Product Preview:
              </p>
              <Image
                width={200}
                height={200}
                src={imagePreview}
                alt="Product preview"
                className="w-48 h-48 object-cover rounded-md border-2 border-green-300 shadow-sm"
              />
            </div>
          )}

          {/*Product Info Section */}
          <div
            className="flex flex-col w-full justify-center mt-4"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            <input
              type="text"
              id="product-id"
              name="product-id"
              placeholder="Product Id: P001"
              className="rounded-md border border-prince-yellow  p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
            <input
              type="text"
              id="product-name"
              name="product-name"
              placeholder="Name: Classic Loaf"
              className="rounded-md border border-prince-yellow  p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
            <div className="mt-3 flex items-center gap-2">
              <input
                type="number"
                step="0.01"
                min="0"
                id="product-price"
                name="product-price"
                placeholder="Price: 99.99"
                className="w-full rounded-md border border-prince-yellow p-2 text-slate-700 focus:border-prince-green focus:outline-none"
              />
              <span className="whitespace-nowrap font-semibold text-prince-shadow/50">
                {currency}
              </span>
            </div>
            {message && (
              <p
                className="mt-3 text-sm font-semibold text-green-700"
                style={{
                  fontFamily: "var(--font-body)",
                }}
              >
                {message}
              </p>
            )}
            {errorMessage && (
              <p
                className="mt-3 text-sm font-semibold text-red-600"
                style={{
                  fontFamily: "var(--font-body)",
                }}
              >
                {errorMessage}
              </p>
            )}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="mt-4 rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 transition-colors duration-300 hover:bg-prince-orange disabled:cursor-not-allowed disabled:opacity-70"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default ProductRegistrationForm;
