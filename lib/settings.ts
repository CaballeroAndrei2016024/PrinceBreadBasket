import { SettingsSchema, type Settings } from "@/lib/validators/settings";

export const SETTINGS_KEY = "princeBreadBasket.Settings";

export const DEFAULT_SETTINGS: Settings = {
  businessName: "",
  businessId: "",
  businessType: "food",
  businessImage: "/newprince.png",
  phone: "",
  email: "",
  vision:
    "This business established its first branch in October 15, 2015 in North Poblacion, La Libertad by Ali Luwalhati as a business after she lost her previous job. It once sold items such as Torta, Francis, Spanish, and many other different types of bread. Its outlet was then established sometime around October 2019, and since then, it has been the primary outlet for the business, with new bread items such as Egg Bread, Sweetheart, Pineapple Pie, and many others, and especially on Christmas season, Custard Cake, Chiffon Cake, Brownies, and Sliced Bread.",
  mission:
    "Our mission and vision is to establish a bakery in every municipality in Negros that would provide customers with",
  history:
    "This business established its first branch in October 15, 2015 in North Poblacion, La Libertad by Ali Luwalhati as a business after she lost her previous job. It once sold items such as Torta, Francis, Spanish, and many other different types of bread. Its outlet was then established sometime around October 2019, and since then, it has been the primary outlet for the business, with new bread items such as Egg Bread, Sweetheart, Pineapple Pie, and many others, and especially on Christmas season, Custard Cake, Chiffon Cake, Brownies, and Sliced Bread.",
  currency: "PHP",
  receiptPrefix: "PB-",
};

let cachedStoredValue: string | null | undefined;
let cachedSettings: Settings = DEFAULT_SETTINGS;

export function subscribeSettings(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SETTINGS_KEY) {
      callback();
    }
  };

  window.addEventListener("settings-changed", callback);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener("settings-changed", callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getSettings(): Settings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  const stored = localStorage.getItem(SETTINGS_KEY);

  if (stored === cachedStoredValue) {
    return cachedSettings;
  }

  if (!stored) {
    cachedStoredValue = null;
    cachedSettings = DEFAULT_SETTINGS;
    return cachedSettings;
  }

  try {
    const parsed = JSON.parse(stored);
    const result = SettingsSchema.safeParse({
      ...DEFAULT_SETTINGS,
      ...parsed,
    });

    cachedStoredValue = stored;
    cachedSettings = result.success ? result.data : DEFAULT_SETTINGS;
    return cachedSettings;
  } catch {
    cachedStoredValue = stored;
    cachedSettings = DEFAULT_SETTINGS;
    return cachedSettings;
  }
}

export function saveSettings(settings: Settings) {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  cachedStoredValue = JSON.stringify(settings);
  cachedSettings = settings;

  window.dispatchEvent(new Event("settings-changed"));
}

export function clearSettings() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(SETTINGS_KEY);
  cachedStoredValue = null;
  cachedSettings = DEFAULT_SETTINGS;

  window.dispatchEvent(new Event("settings-changed"));
}
