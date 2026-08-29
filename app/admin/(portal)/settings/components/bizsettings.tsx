"use client";

//Necessary Imports.
import { useState } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_SETTINGS,
  clearSettings,
  getSettings,
  saveSettings,
} from "@/lib/settings";
import { SettingsSchema, type Settings } from "@/lib/validators/settings";

type SettingsForm = Settings;

function toFormValues(settings: Settings): SettingsForm {
  return { ...settings };
}

const BizSettings = () => {
  //Setting state for the setting submission.
  const [form, setForm] = useState<SettingsForm>(() =>
    toFormValues(getSettings()),
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const updateField = <Field extends keyof SettingsForm>(
    field: Field,
    value: SettingsForm[Field],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
    setMessage(null);
    setErrorMessage(null);
  };

  //How to handle image submission changes.

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      setFileName(null);
      return;
    }

    setFileName(file.name);

    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateField("businessImage", reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  //Submit syntax.

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setErrorMessage(null);

    const result = SettingsSchema.safeParse(form);

    if (!result.success) {
      setErrorMessage(
        result.error.issues[0]?.message ?? "Please review the settings.",
      );
      return;
    }

    saveSettings(result.data);
    setForm(toFormValues(result.data));
    setMessage("Settings saved.");
  };

  const handleReset = () => {
    clearSettings();
    setForm(toFormValues(DEFAULT_SETTINGS));
    setErrorMessage(null);
    setMessage("Settings reset to defaults.");
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle
          className="font-bold text-2xl text-prince-yellow text-shadow-sm"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Business settings
        </CardTitle>
        <CardDescription>
          Set the business details used throughout Prince Bread Basket.
        </CardDescription>
      </CardHeader>
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow border-2 bg-prince-shadow-80 p-6 shadow-lg"
      >
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-medium">
            Business name
            <Input
              required
              value={form.businessName}
              onChange={(event) =>
                updateField("businessName", event.target.value)
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Business ID
            <Input
              required
              value={form.businessId}
              onChange={(event) =>
                updateField("businessId", event.target.value)
              }
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Business type
            <Input
              required
              value={form.businessType}
              onChange={(event) =>
                updateField("businessType", event.target.value)
              }
            />
          </label>
          <div className="grid gap-2 text-sm font-medium sm:col-span-2">
            Business image
            <div className="flex items-center gap-4">
              <Input
                type="file"
                id="business-image"
                name="business-image"
                accept="image/jpg, image/jpeg, image/png, image/gif"
                onChange={handleImageChange}
                className="hidden"
              />

              <label
                htmlFor="business-image"
                className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-prince-green px-4 py-2 font-bold text-prince-shadow/50 shadow-md transition hover:bg-prince-orange"
              >
                Choose File
              </label>

              <span className="text-sm text-slate-300">
                {fileName ?? "No file chosen"}
              </span>
            </div>
            {form.businessImage && (
              <Image
                src={form.businessImage}
                alt="Business image preview"
                width={128}
                height={128}
                className="mt-2 h-32 w-32 rounded-lg object-cover shadow-md"
              />
            )}
          </div>

          <label className="grid gap-2 text-sm font-medium">
            Phone
            <Input
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Email
            <Input
              type="email"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Vision
            <Input
              type="text"
              value={form.vision ?? ""}
              onChange={(event) => updateField("vision", event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Mission
            <Input
              type="text"
              value={form.mission ?? ""}
              onChange={(event) => updateField("mission", event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm font-medium">
            Currency
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              value={form.currency}
              onChange={(event) =>
                updateField(
                  "currency",
                  event.target.value as Settings["currency"],
                )
              }
            >
              <option value="PHP">PHP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-medium sm:col-span-2">
            Receipt prefix
            <Input
              value={form.receiptPrefix}
              onChange={(event) =>
                updateField("receiptPrefix", event.target.value)
              }
            />
          </label>
        </CardContent>
        <CardFooter className="flex-wrap justify-between gap-3">
          <div aria-live="polite" className="text-sm">
            {errorMessage && (
              <span className="text-destructive">{errorMessage}</span>
            )}
            {message && (
              <span className="text-muted-foreground">{message}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit">Save settings</Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default BizSettings;
