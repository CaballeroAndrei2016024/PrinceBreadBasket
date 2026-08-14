import { redirect } from "next/navigation";
import { logout } from "@/lib/libauth";
import AdminNavbarClient from "./adminclient";
import type { NavItem } from "../types";

const AdminBarItems: NavItem[] = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: "/newhome.png",
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: "/settings.png",
  },
  {
    name: "Products",
    href: "/admin/products",
    icon: "/newproducts.png",
  },
  {
    name: "Sales",
    href: "/admin/sales",
    icon: "/newsales.png",
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: "/newreports.png",
  },
  {
    name: "Logs",
    href: "/admin/logs",
    icon: "/newlogs.png",
  },
  {
    name: "Logout",
    icon: "/logout.png",
    action: "logout",
  },
];

async function handleLogout() {
  "use server";
  await logout();
  redirect("/login");
}

export default function AdminNavbar() {
  return (
    <AdminNavbarClient items={AdminBarItems} logoutAction={handleLogout} />
  );
}
