import { redirect } from "next/navigation";
import { logout } from "@/lib/libauth";
import NavbarClient from "./navbar-client";

const NavBarItems = [
  { name: "Home", href: "/", icon: "/newhome.png" },
  { name: "Products", href: "/products", icon: "/newproducts.png" },
  { name: "Customers", href: "/customers", icon: "/customers.png" },
  { name: "Transactions", href: "/transactions", icon: "/transactions.png" },
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

export default function Navbar() {
  return <NavbarClient items={NavBarItems} logoutAction={handleLogout} />;
}
