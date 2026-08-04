import type { Metadata } from "next";
import { Cinzel, Nunito } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const cinzel = Cinzel({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-heading",
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Prince Bread Basket",
  description:
    "Sales, reports, and inventory management for Prince Bread Basket",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        cinzel.variable,
        nunito.variable,
        "font-sans",
      )}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
