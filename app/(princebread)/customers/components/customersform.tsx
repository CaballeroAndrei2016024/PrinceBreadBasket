"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const CustomerRegistrationForm = () => {
  // Customer Code.
  const [customerCode, setCustomerCode] = useState("Customer Number here");
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
      "customer-image",
    ) as HTMLInputElement | null;

    if (!fileInput?.files?.[0]) {
      setErrorMessage("Please upload an image file.");
      setIsSubmitting(false);
      return;
    }

    // Clear the formData and rebuild it with the file
    formData.set("customer-image", fileInput.files[0]);

    console.log("Submitting form to /routes/customers");

    try {
      try {
        console.log("FormData entries:", Array.from(formData.entries()));
      } catch (e) {}

      const response = await fetch("/routes/customers", {
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
        throw new Error(firstError || "Failed to save customer.");
      }
      setCustomerCode(result?.customerCode ?? "");
      setMessage(result?.message || "Customer created successfully.");
      formElement.reset();
      setImagePreview(null);
      setFileName(null);
      router.push("/customers");
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
            Add Customers
          </h1>
        </div>
        <form
          onSubmit={handleSubmit}
          method="POST"
          className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow border-2 bg-prince-green-80 p-6 shadow-lg"
        >
          {/*Customer Image Section */}
          <div className="flex flex-col w-full text-left">
            <label
              htmlFor="customer-image"
              className="mb-2 font-semibold text-prince-shadow/50 text-shadow-sm"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              Upload Customer Pic
            </label>

            <div
              className="flex items-center gap-4"
              style={{
                fontFamily: "var(--font-body)",
              }}
            >
              <input
                type="file"
                id="customer-image"
                name="customer-image"
                accept="image/jpg, image/jpeg, image/png, image/gif"
                onChange={handleImageChange}
                className="hidden"
              />

              <label
                htmlFor="customer-image"
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
                Customer Preview:
              </p>
              <Image
                width={200}
                height={200}
                src={imagePreview}
                alt="Customer preview"
                className="w-48 h-48 object-cover rounded-md border-2 border-green-300 shadow-sm"
              />
            </div>
          )}

          {/*Customer Info Section */}
          <div
            className="flex flex-col w-full justify-center mt-4"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            <input
              id="customer-code"
              type="text"
              value={customerCode}
              readOnly
              className="rounded-md border border-prince-yellow bg-gray-100 p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
            <input
              type="text"
              id="customer-name"
              name="customer-name"
              placeholder="Name: John Doe"
              className="rounded-md border border-prince-yellow  p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
            <input
              type="date"
              id="birthdate"
              name="birthdate"
              placeholder="Birthdate: 11/01/03"
              className="rounded-md border border-prince-yellow  p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
            <input
              type="text"
              id="address"
              name="address"
              placeholder="Address: Sitio Kawayanan, Barangay Tayud, Liloan, Cebu"
              className="rounded-md border border-prince-yellow  p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
            <input
              type="text"
              id="phone"
              name="phone"
              placeholder="Phone #:12-34567890"
              className="rounded-md border border-prince-yellow  p-2 text-slate-700 focus:border-prince-green focus:outline-none"
            />
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

export default CustomerRegistrationForm;
