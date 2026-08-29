"use client";

import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

//Add the name of the business to the settings page.

export default function BusinessName() {
  const settings = useSyncExternalStore(subscribeSettings, getSettings, () =>
    getSettings(),
  );

  return <span>{settings.businessName}</span>;
}
