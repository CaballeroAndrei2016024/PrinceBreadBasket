"use client";

import Image from "next/image";
import Link from "next/link";

type NavItem = {
  name: string;
  icon: string;
  href?: string;
  action?: "logout";
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  items: NavItem[];
  logoutAction: () => Promise<void>;
};

export default function AdminMobileDrawer({
  isOpen,
  onClose,
  items,
  logoutAction,
}: Props) {
  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          isOpen
            ? "opacity-100 visible pointer-events-auto"
            : "opacity-0 invisible pointer-events-none"
        }`}
      />

      <aside
        className={`fixed top-0 left-0 z-50 flex h-screen w-72 max-w-full flex-col rounded-r-3xl border-r border-prince-shadow/20 bg-prince-yellow shadow-2xl transition-transform duration-300 md:hidden ${
          isOpen
            ? "translate-x-0 pointer-events-auto"
            : "-translate-x-full pointer-events-none"
        }`}
        style={{
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <h2 className="text-xl font-bold text-slate-900">Menu</h2>
          <button onClick={onClose} className="text-2xl text-slate-900">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {items.map((item) =>
            item.action === "logout" ? (
              <form
                key={item.name}
                action={logoutAction}
                className="border-t border-slate-200 px-6 py-4"
              >
                <button
                  type="submit"
                  onClick={onClose}
                  className="flex w-full items-center gap-4 rounded-md bg-prince-green px-6 py-4 text-slate-50 transition hover:bg-prince-orange"
                  aria-label="Logout"
                >
                  <Image
                    src={item.icon}
                    alt={item.name}
                    width={28}
                    height={28}
                  />
                  <span className="font-semibold">{item.name}</span>
                </button>
              </form>
            ) : (
              <Link
                key={item.href ?? item.name}
                href={item.href ?? "/"}
                onClick={onClose}
                className="flex items-center gap-4 px-6 py-4 text-slate-900 transition hover:bg-prince-green"
              >
                <Image src={item.icon} alt={item.name} width={28} height={28} />
                <span className="font-semibold">{item.name}</span>
              </Link>
            ),
          )}
        </div>
      </aside>
    </>
  );
}
