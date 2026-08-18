import { NextRequest } from "next/server";
import { getCurrentWeather } from "@/lib/kma-weather";

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  try {
    const weather = await getCurrentWeather(
      Number.isFinite(lat) ? lat : undefined,
      Number.isFinite(lon) ? lon : undefined,
    );
    return Response.json({ weather });
  } catch (error) {
    console.error(error);
    return Response.json({ weather: null }, { status: 200 });
  }
}
