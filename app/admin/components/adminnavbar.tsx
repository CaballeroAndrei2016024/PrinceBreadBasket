import { redirect } from "next/navigation";
import { logout } from "@/lib/libauth";
import AdminNavbarClient from "./adminclient";

const NavBarItems = [
  { name: "Dashboard", href: "/", icon: "/newhome.png" },
  { name: "Products", href: "/products", icon: "/newproducts.png" },
  { name: "Sales", href: "/sales", icon: "/newsales.png" },
  { name: "Reports", href: "/reports", icon: "/newreports.png" },
  { name: "Logs", href: "/logs", icon: "/newlogs.png" },
  { name: "Logout", icon: "/logout.png", action: "logout" as const },
];

async function handleLogout() {
  "use server";
  await logout();
  redirect("/login");
}

export default function AdminNavbar() {
  return <AdminNavbarClient items={NavBarItems} logoutAction={handleLogout} />;
}
