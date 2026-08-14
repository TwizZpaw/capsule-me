import { connection } from "next/server";
import { CapsuleDashboard } from "@/components/capsule-dashboard";
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
    <div className="flex-1 bg-linear-to-b from-amber-50 via-rose-50 to-stone-100">
      <CapsuleDashboard capsules={capsules} />
    </div>
  );
}
