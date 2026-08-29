import Navbar from "./components/navbar";
import BusinessIdentity from "./components/businessidentity";

export default function PrincebreadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <div className="w-full flex relative h-40 sm:h-52 md:h-64 justify-center bg-prince-green/80">
        <BusinessIdentity />
      </div>
      <div className="flex flex-col bg-prince-green/80 text-slate-800 min-h-full">
        {children}
      </div>
    </>
  );
}
