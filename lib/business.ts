import type { BusinessSettings } from "@/lib/validators/bzsettings";

export const BUSINESS_SETTINGS_KEY = "princeBreadBasket.businessSettings";

export const DEFAULT_BUSINESS_SETTINGS: BusinessSettings = {
  businessName: "",
  businessId: "",
  businessType: "food",

  phone: "",
  email: "",

  address: "",
  barangay: "",
  city: "",
  province: "",
  zip: "",

  currency: "PHP",
  taxRate: 0,
  receiptPrefix: "PB-",

  lowStockThreshold: 10,
  allowNegativeInventory: false,
  automaticInventoryDeduction: true,
};

export function getBusinessSettings(): BusinessSettings {
  if (typeof window === "undefined") {
    return DEFAULT_BUSINESS_SETTINGS;
  }

  const stored = localStorage.getItem(BUSINESS_SETTINGS_KEY);

  if (!stored) {
    return DEFAULT_BUSINESS_SETTINGS;
  }

  try {
    const parsed = JSON.parse(stored);

    return {
      ...DEFAULT_BUSINESS_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_BUSINESS_SETTINGS;
  }
}

export function saveBusinessSettings(settings: BusinessSettings) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(BUSINESS_SETTINGS_KEY, JSON.stringify(settings));

  window.dispatchEvent(new Event("business-settings-changed"));
}

export function clearBusinessSettings() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(BUSINESS_SETTINGS_KEY);

  window.dispatchEvent(new Event("business-settings-changed"));
}
