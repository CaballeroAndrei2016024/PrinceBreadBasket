import Image from "next/image";
import AdminNavbar from "./components/adminnavbar";

export default function PrincebreadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AdminNavbar />
      <div className="w-full flex relative h-40 sm:h-52 md:h-64 justify-center bg-prince-green/80">
        <Image
          src="/newprince.png"
          alt="Prince Bread Basket"
          width={350}
          height={350}
        />
      </div>
      <div className="flex flex-col bg-prince-green/80 text-slate-800 min-h-full">
        {children}
      </div>
    </>
  );
}
