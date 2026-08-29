"use client";

import Image from "next/image";
import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

export default function BusinessIdentity() {
  const settings = useSyncExternalStore(subscribeSettings, getSettings, () =>
    getSettings(),
  );
  const businessName = settings.businessName || "Prince Bread Basket";
  const businessImage = settings.businessImage || "/newprince.png";

  return (
    <div className="flex w-full flex-col items-center justify-center gap-2 px-4 text-center">
      <Image
        src={businessImage}
        alt={`${businessName} logo`}
        width={180}
        height={180}
        className="h-32 w-32 object-contain sm:h-40 sm:w-40"
      />
      <div>
        <h1 className="text-xl font-bold text-prince-yellow sm:text-2xl">
          {businessName}
        </h1>
        <p className="text-sm text-white/80">
          {settings.businessType} | ID: {settings.businessId || "Not set"}
        </p>
      </div>
    </div>
  );
}
