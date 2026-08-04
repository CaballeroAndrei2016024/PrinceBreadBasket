import { redirect } from "next/navigation";
import { getSession } from "@/lib/libauth";

export default async function Home() {
  //Session getter, to make sure no one tries anything funny.
  const session = await getSession();

  if (!session) {
    redirect("/login"); // Told you.
  }
  return (
    <div className="flex flex-col flex-1 w-full font-sans">
      <main className="flex flex-col items-center justify-center flex-1 w-full px-6 py-10 text-center md:px-20 space-y-6">
        <div className="flex w-full max-w-3xl flex-col items-center rounded-xl border border-prince-yellow bg-prince-green p-6 shadow-lg text-white">
          <p
            className="text-base font-semibold leading-relaxed text-prince-yellow text-shadow-lg"
            style={{
              fontFamily: "var(--font-heading)",
            }}
          >
            Welcome to Prince Bread Basket, your one-stop for all your bread
            needs!
          </p>
        </div>
        <div className="flex w-full max-w-3xl flex-col items-start rounded-xl border border-prince-yellow border-2 bg-prince-green-80 p-6 shadow-md">
          <h1
            className="mb-3 text-2xl font-bold text-prince-red font-heading text-shadow-sm"
            style={{
              fontFamily: "var(--font-heading)",
            }}
          >
            Vision and Mission
          </h1>
          <p
            className="text-base font-medium leading-relaxed text-prince-shadow/50 text-shadow-sm font-body"
            style={{
              fontFamily: "var(--font-body)",
            }}
          >
            Our mission and vision is to establish a bakery in every
            municipality in Negros that would provide customers with
            high-quality bread.
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
            This business established its first branch in October 15, 2015 in
            North Poblacion, La Libertad by Ali Luwalhati as a business after
            she lost her previous job. It once sold items such as Torta,
            Francis, Spanish, and many other different types of bread. Its
            outlet was then established sometime around October 2019, and since
            then, it has been the primary outlet for the business, with new
            bread items such as Egg Bread, Sweetheart, Pineapple Pie, and many
            others, and especially on Christmas season, Custard Cake, Chiffon
            Cake, Brownies, and Sliced Bread.
          </p>
        </div>
      </main>
    </div>
  );
}
