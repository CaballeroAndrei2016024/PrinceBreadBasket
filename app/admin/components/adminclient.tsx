"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import AdminMobileDrawer from "./admindrawer";
import { NavItem } from "../types";

type AdminNavbarClientProps = {
  items: NavItem[];
  logoutAction: () => Promise<void>;
};

export default function AdminNavbarClient({
  items,
  logoutAction,
}: AdminNavbarClientProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <nav
        className="sticky top-0 z-40 border-b border-prince-shadow/20 bg-prince-green shadow-lg"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div className="mx-auto flex h-16 items-center justify-between px-4">
          <div className="hidden items-center gap-8 md:flex">
            <div className="hidden sm:block">
              <p className="text-xs text-white/80">Admin Module</p>
            </div>
            {items.map((item) =>
              item.href ? (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center text-white transition hover:text-prince-yellow"
                  style={{
                    fontFamily: "var(--font-body)",
                  }}
                >
                  <Image
                    src={item.icon}
                    alt={item.name}
                    width={24}
                    height={24}
                  />

                  <span className="text-xs font-semibold tracking-wide">
                    {item.name.toUpperCase()}
                  </span>
                </Link>
              ) : (
                <form key={item.name} action={logoutAction}>
                  <button
                    type="submit"
                    className="flex flex-col items-center rounded-md border border-white/20 px-3 py-1 text-white transition hover:bg-white/10 hover:text-prince-yellow"
                    aria-label="Logout"
                  >
                    <Image
                      src={item.icon}
                      alt={item.name}
                      width={24}
                      height={24}
                    />
                    <span className="text-xs font-semibold tracking-wide">
                      {item.name.toUpperCase()}
                    </span>
                  </button>
                </form>
              ),
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
            }}
            className="rounded-md p-2 text-white hover:bg-white/10 md:hidden"
            aria-label="Open Menu"
          >
            ☰
          </button>
        </div>
      </nav>

      <AdminMobileDrawer
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
        }}
        items={items}
        logoutAction={logoutAction}
      />
    </>
  );
}
