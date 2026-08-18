export type WeatherSnapshot = {
  condition: string;
  temperature: number | null;
  humidity: number | null;
};

export type WeatherKind =
  | "clear"
  | "cloudy"
  | "rain"
  | "snow"
  | "storm"
  | "humid"
  | "hot"
  | "cold";

export function weatherKind(
  weather: WeatherSnapshot | null | undefined,
): WeatherKind {
  const condition = weather?.condition ?? "";
  const temperature = weather?.temperature ?? 20;
  const humidity = weather?.humidity ?? 50;

  if (condition.includes("눈") || condition.includes("날림")) return "snow";
  if (condition.includes("소나기")) return "storm";
  if (condition.includes("비") || condition.includes("빗방울")) return "rain";
  if (condition.includes("구름") || condition.includes("흐림")) return "cloudy";
  if (temperature <= 5) return "cold";
  if (temperature >= 28) return "hot";
  if (humidity >= 75) return "humid";
  return "clear";
}

export function formatWeather(weather: WeatherSnapshot | null | undefined) {
  if (!weather) return null;

  const parts = [weather.condition];
  if (weather.temperature != null && Number.isFinite(weather.temperature)) {
    parts.push(`${Math.round(weather.temperature)}°`);
  }
  if (weather.humidity != null && Number.isFinite(weather.humidity)) {
    parts.push(`습도 ${Math.round(weather.humidity)}%`);
  }

  return parts.join(" · ");
}

export function weatherFromRow(row: {
  weather?: string | null;
  temperature?: number | string | null;
  humidity?: number | string | null;
}): WeatherSnapshot | null {
  if (row.weather == null && row.temperature == null && row.humidity == null) {
    return null;
  }

  return {
    condition: row.weather || "날씨",
    temperature: row.temperature == null ? null : Number(row.temperature),
    humidity: row.humidity == null ? null : Number(row.humidity),
  };
}
