import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";
import HomeSettings from "./home-settings";

export const metadata = {
  title: "Welcome Home!",
  description: "This is the page where you can see your company information.",
};

export default async function Home() {
  //Session getter, to make sure no one tries anything funny.
  const session = await getSession();

  if (!session) {
    redirect("/login"); // Told you.
  }
  return (
    <div className="flex flex-col flex-1 w-full font-sans">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-6 py-10 text-center md:px-20 space-y-6">
        <HomeSettings />
      </main>
    </div>
  );
}
