"use client";

import { useEffect, useState } from "react";
import { CapsuleDashboard } from "@/components/capsule-dashboard";
import { WeatherScene } from "@/components/weather-scene";
import type { CapsuleSummary } from "@/lib/capsules";
import type { WeatherSnapshot } from "@/lib/weather";

function getBrowserCoords() {
  if (!navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise<{ lat: number; lon: number } | null>((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 10 * 60 * 1000 },
    );
  });
}

export function HomeScreen({ capsules }: { capsules: CapsuleSummary[] }) {
  const [skyWeather, setSkyWeather] = useState<WeatherSnapshot | null>(null);

  useEffect(() => {
    void (async () => {
      const coords = await getBrowserCoords();
      const params = new URLSearchParams();
      if (coords) {
        params.set("lat", String(coords.lat));
        params.set("lon", String(coords.lon));
      }

      const query = params.toString();
      const response = await fetch(query ? `/api/weather?${query}` : "/api/weather");
      if (!response.ok) {
        setSkyWeather(null);
        return;
      }

      const payload = (await response.json()) as { weather?: WeatherSnapshot | null };
      setSkyWeather(payload.weather ?? null);
    })().catch(() => {
      setSkyWeather(null);
    });
  }, []);

  return (
    <WeatherScene
      weather={skyWeather}
      className="min-h-[calc(100dvh-3.5rem)] flex-1"
    >
      <CapsuleDashboard capsules={capsules} weather={skyWeather} />
    </WeatherScene>
  );
}
