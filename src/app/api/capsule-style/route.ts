import { NextRequest } from "next/server";
import { generateCapsuleStyle } from "@/lib/gemini-capsule";
import type { WeatherSnapshot } from "@/lib/weather";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    weather?: WeatherSnapshot | null;
    letter?: string;
  };

  const style = await generateCapsuleStyle({
    weather: body.weather ?? null,
    letter: typeof body.letter === "string" ? body.letter : "",
  });

  return Response.json({ style });
}
