import { formatWeather, type WeatherSnapshot } from "@/lib/weather";

export function WeatherNote({
  weather,
  className = "text-sm text-stone-500",
}: {
  weather: WeatherSnapshot | null | undefined;
  className?: string;
}) {
  const label = formatWeather(weather);
  if (!label) return null;

  return <p className={className}>묻은 날 · {label}</p>;
}
