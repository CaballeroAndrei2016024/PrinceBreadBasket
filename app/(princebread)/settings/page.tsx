"use client";

import React, { useState } from "react";

interface SettingsState {
  businessName: string;
  address: string;
  currency: string;
  taxRate: string;
  compactView: boolean;
  printAfterSale: boolean;
  confirmDelete: boolean;
}

const defaultSettings: SettingsState = {
  businessName: "Prince Bread Basket",
  address: "",
  currency: "PHP",
  taxRate: "12",
  compactView: false,
  printAfterSale: true,
  confirmDelete: true,
};

function getInitialSettings(): SettingsState {
  if (typeof window === "undefined") {
    return defaultSettings;
  }

  const stored = window.localStorage.getItem("princebread-settings");

  if (!stored) {
    return defaultSettings;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<SettingsState>;

    return {
      ...defaultSettings,
      ...parsed,
    };
  } catch {
    return defaultSettings;
  }
}

const SettingsPage = () => {
  const [settings, setSettings] = useState<SettingsState>(getInitialSettings);

  const [saved, setSaved] = useState(false);

  const saveSettings = () => {
    window.localStorage.setItem(
      "princebread-settings",
      JSON.stringify(settings),
    );

    setSaved(true);

    window.setTimeout(() => {
      setSaved(false);
    }, 1400);
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-gray-900">
          Low-cost app settings
        </h1>

        <p className="mt-1 text-sm text-gray-600">
          These options are kept in your browser, so they stay lightweight and
          avoid extra service cost.
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">Business details</h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-700">
            <span className="mb-1 block font-medium">Business name</span>

            <input
              value={settings.businessName}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  businessName: e.target.value,
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Your shop name"
            />
          </label>

          <label className="text-sm text-gray-700 md:col-span-2">
            <span className="mb-1 block font-medium">Address / note</span>

            <textarea
              value={settings.address}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  address: e.target.value,
                })
              }
              className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2"
              placeholder="Optional address or receipt note"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">
          Pricing and defaults
        </h2>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-700">
            <span className="mb-1 block font-medium">Currency</span>

            <select
              value={settings.currency}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  currency: e.target.value,
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            >
              <option value="PHP">PHP</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </label>

          <label className="text-sm text-gray-700">
            <span className="mb-1 block font-medium">Tax rate (%)</span>

            <input
              type="number"
              min="0"
              max="100"
              value={settings.taxRate}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  taxRate: e.target.value,
                })
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2"
            />
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-medium text-gray-900">
          Display and workflow
        </h2>

        <div className="mt-3 space-y-3">
          <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
            <span>
              <span className="block font-medium text-gray-900">
                Compact view
              </span>

              <span className="text-sm text-gray-500">
                Use a tighter layout for smaller screens.
              </span>
            </span>

            <input
              type="checkbox"
              checked={settings.compactView}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  compactView: e.target.checked,
                })
              }
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
            <span>
              <span className="block font-medium text-gray-900">
                Print after sale
              </span>

              <span className="text-sm text-gray-500">
                Open the receipt automatically after a sale.
              </span>
            </span>

            <input
              type="checkbox"
              checked={settings.printAfterSale}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  printAfterSale: e.target.checked,
                })
              }
              className="h-4 w-4"
            />
          </label>

          <label className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2">
            <span>
              <span className="block font-medium text-gray-900">
                Confirm delete actions
              </span>

              <span className="text-sm text-gray-500">
                Add a quick safety prompt before deleting records.
              </span>
            </span>

            <input
              type="checkbox"
              checked={settings.confirmDelete}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  confirmDelete: e.target.checked,
                })
              }
              className="h-4 w-4"
            />
          </label>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-gray-600">
          {saved
            ? "Settings saved locally."
            : "Changes stay on this device only."}
        </p>

        <button
          type="button"
          onClick={saveSettings}
          className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Save settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
