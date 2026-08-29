"use client";

import { useSyncExternalStore } from "react";
import { getSettings, subscribeSettings } from "@/lib/settings";

export default function HomeSettings() {
  const settings = useSyncExternalStore(
    subscribeSettings,
    getSettings,
    getSettings,
  );
  const businessName = settings.businessName || "Prince Bread Basket";
  const vision = settings.vision || "Our vision has not been set yet.";
  const mission = settings.mission || "Our mission has not been set yet.";
  const history = settings.history || "Our history has not been set yet.";

  return (
    <>
      <div className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg text-white">
        <p
          className="text-base font-semibold leading-relaxed text-prince-yellow text-shadow-lg"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Welcome to {businessName}, your one-stop for all your bread needs!
        </p>
      </div>
      <div className="flex w-full max-w-3xl flex-col items-start rounded-xl border border-prince-yellow border-2 bg-prince-green-80 p-6 shadow-md">
        <p
          className="text-base font-medium leading-relaxed text-prince-shadow/50 text-shadow-sm"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          <strong>Vision:</strong> {vision}
        </p>

        <p
          className="mt-3 text-base font-medium leading-relaxed text-prince-shadow/50 text-shadow-sm"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          <strong>Mission:</strong> {mission}
        </p>
      </div>
      <div className="flex w-full max-w-3xl flex-col items-start rounded-xl border border-prince-yellow border-2 bg-prince-green-80 p-6 shadow-md">
        <h1
          className="mb-3 text-2xl font-bold text-prince-red font-heading text-shadow-sm"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Our History
        </h1>
        <p
          className="text-base font-medium leading-relaxed text-prince-shadow/50 text-shadow-sm"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          {history}
        </p>
      </div>
      <div className="flex w-full max-w-3xl flex-col items-center justify-center rounded-xl border-2 border-prince-yellow bg-prince-green-80 p-6 shadow-md">
        <h1
          className="mb-3 text-2xl font-bold text-prince-red font-heading text-shadow-sm"
          style={{
            fontFamily: "var(--font-heading)",
          }}
        >
          Contact Us
        </h1>
        <p
          className="flex flex-col gap-1 text-base items-center font-medium leading-relaxed text-prince-shadow/50 text-shadow-sm"
          style={{
            fontFamily: "var(--font-body)",
          }}
        >
          <span>Our Phone: {settings.phone || "Not set"}</span>
          <span>Our Email: {settings.email || "Not set"}</span>
        </p>
      </div>
    </>
  );
}
