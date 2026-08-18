import { connection } from "next/server";
import { HomeScreen } from "@/components/home-screen";
import { listCapsules, type CapsuleSummary } from "@/lib/capsules";

export default async function Home() {
  await connection();

  let capsules: CapsuleSummary[] = [];
  try {
    capsules = await listCapsules();
  } catch (error) {
    console.error(error);
  }

  return (
    <div className="flex flex-1 flex-col">
      <HomeScreen capsules={capsules} />
    </div>
  );
}
