"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

//Business Imports.
import {
  DEFAULT_BUSINESS_SETTINGS,
  getBusinessSettings,
  saveBusinessSettings,
} from "@/lib/business";
import type { BusinessSettings as BusinessSettingsType } from "@/lib/validators/bzsettings";

const BusinessSettings = () => {
  const [settings, setSettings] = useState<BusinessSettingsType>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_BUSINESS_SETTINGS;
    }

    return getBusinessSettings();
  });

  const updateSetting = <K extends keyof BusinessSettingsType>(
    key: K,
    value: BusinessSettingsType[K],
  ) => {
    setSettings((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSave = () => {
    saveBusinessSettings(settings);
  };

  return (
    <div className="space-y-6">
      {/* This is where the information about the business is stored. */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Basic information about your business.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={settings.businessName}
              onChange={(e) => updateSetting("businessName", e.target.value)}
              placeholder="Prince Bread Basket"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessId">Business ID</Label>
            <Input
              id="businessId"
              value={settings.businessId}
              onChange={(e) => updateSetting("businessId", e.target.value)}
              placeholder="Enter business ID"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessType">Business Type</Label>

            <Select
              value={settings.businessType}
              onValueChange={(value) => {
                if (value !== null) {
                  updateSetting("businessType", value);
                }
              }}
            >
              <SelectTrigger id="businessType">
                <SelectValue placeholder="Select business type" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="clothes">Clothing Business</SelectItem>
                <SelectItem value="medicine">Pharmacy</SelectItem>
                <SelectItem value="agricultural">Agricultural</SelectItem>
                <SelectItem value="produce">Produce Business</SelectItem>
                <SelectItem value="retail">Retail</SelectItem>
                <SelectItem value="food">Food Business</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Contact details.</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={settings.phone}
              onChange={(e) => updateSetting("phone", e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={settings.email}
              onChange={(e) => updateSetting("email", e.target.value)}
              placeholder="Enter email address"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Address</CardTitle>
          <CardDescription>Where does your business live in?</CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={settings.address}
              onChange={(e) => updateSetting("address", e.target.value)}
              placeholder="House/Building No., Street"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barangay">Barangay</Label>
            <Input
              id="barangay"
              value={settings.barangay}
              onChange={(e) => updateSetting("barangay", e.target.value)}
              placeholder="Barangay"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City / Municipality</Label>
            <Input
              id="city"
              value={settings.city}
              onChange={(e) => updateSetting("city", e.target.value)}
              placeholder="City or Municipality"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <Input
              id="province"
              value={settings.province}
              onChange={(e) => updateSetting("province", e.target.value)}
              placeholder="Province"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip">ZIP</Label>
            <Input
              id="zip"
              value={settings.zip}
              onChange={(e) => updateSetting("zip", e.target.value)}
              placeholder="ZIP"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sales Settings</CardTitle>
          <CardDescription>
            Default settings used by sales transactions and reports.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>

            <Select
              value={settings.currency}
              onValueChange={(value) => {
                if (value === "PHP" || value === "USD" || value === "EUR") {
                  updateSetting("currency", value);
                }
              }}
            >
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="PHP">PHP (₱)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="taxRate">Tax Rate (%)</Label>
            <Input
              id="taxRate"
              type="number"
              min="0"
              step="0.01"
              value={String(settings.taxRate)}
              onChange={(e) => updateSetting("taxRate", Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="receiptPrefix">Transaction Prefix</Label>
            <Input
              id="receiptPrefix"
              value={settings.receiptPrefix}
              onChange={(e) => updateSetting("receiptPrefix", e.target.value)}
              placeholder="Enter receipt prefix"
            />
          </div>
        </CardContent>
      </Card>

      {/*How should the transportation be represented as? */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Settings</CardTitle>
          <CardDescription>
            Configure how inventory behaves when sales are recorded.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="lowStockThreshold">Low Stock Threshold</Label>

            <Input
              id="lowStockThreshold"
              type="number"
              min="0"
              value={String(settings.lowStockThreshold)}
              onChange={(e) =>
                updateSetting("lowStockThreshold", Number(e.target.value))
              }
            />

            <p className="text-sm text-muted-foreground">
              Products at or below this quantity can be considered low stock.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="allowNegativeInventory">
                Allow Negative Inventory
              </Label>

              <p className="text-sm text-muted-foreground">
                Allow sales to reduce inventory below zero.
              </p>
            </div>

            <Switch
              id="allowNegativeInventory"
              checked={settings.allowNegativeInventory}
              onCheckedChange={(value) =>
                updateSetting("allowNegativeInventory", value)
              }
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-1">
              <Label htmlFor="automaticInventoryDeduction">
                Automatic Inventory Deduction
              </Label>

              <p className="text-sm text-muted-foreground">
                Automatically deduct sold quantities from inventory.
              </p>
            </div>

            <Switch
              id="automaticInventoryDeduction"
              checked={settings.automaticInventoryDeduction}
              onCheckedChange={(value) =>
                updateSetting("automaticInventoryDeduction", value)
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardFooter className="flex justify-end gap-3 pt-6">
          <Button variant="outline" type="button">
            Cancel
          </Button>

          <Button type="button" onClick={handleSave}>
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default BusinessSettings;
