import { weatherKind, type WeatherKind, type WeatherSnapshot } from "@/lib/weather";

export const CAPSULE_SHAPES = [
  "orb",
  "drop",
  "cloud",
  "sun",
  "flake",
  "petal",
  "lantern",
  "wave",
] as const;

export type CapsuleShape = (typeof CAPSULE_SHAPES)[number];
export type CapsuleFill = "gradient" | "solid";

export type CapsuleStyle = {
  phrase: string;
  keywords: string[];
  shape: CapsuleShape;
  fill: CapsuleFill;
  colorFrom: string;
  colorTo: string;
  colorAccent: string;
};

type Hsl = { h: number; s: number; l: number };

const HEX = /^#([0-9a-fA-F]{6})$/;
const HUE_GAP_FOR_GRADIENT = 22;

const WEATHER_HUE: Record<WeatherKind, number> = {
  clear: 198,
  cloudy: 220,
  rain: 212,
  snow: 205,
  storm: 248,
  humid: 168,
  hot: 28,
  cold: 214,
};

const WEATHER_SATURATION: Record<WeatherKind, number> = {
  clear: 0.58,
  cloudy: 0.42,
  rain: 0.55,
  snow: 0.4,
  storm: 0.62,
  humid: 0.52,
  hot: 0.64,
  cold: 0.48,
};

const LETTER_HUES: { pattern: RegExp; hue: number }[] = [
  { pattern: /사랑|보고싶|그리움|마음|좋아|연인|고백/, hue: 350 },
  { pattern: /미안|죄송|후회|잘못/, hue: 286 },
  { pattern: /슬프|눈물|아프|힘들|외로/, hue: 228 },
  { pattern: /축하|기쁘|행복|웃|신나|즐거/, hue: 46 },
  { pattern: /고마|감사|덕분/, hue: 152 },
  { pattern: /화나|짜증|답답|분노/, hue: 12 },
  { pattern: /꿈|희망|미래|응원/, hue: 164 },
  { pattern: /안녕|평온|쉬|편안|조용/, hue: 188 },
  { pattern: /그리|추억|그때|옛날/, hue: 32 },
];

function isShape(value: unknown): value is CapsuleShape {
  return CAPSULE_SHAPES.includes(value as CapsuleShape);
}

function hexOr(value: unknown, fallback: string) {
  return typeof value === "string" && HEX.test(value) ? value : fallback;
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function hueDiff(a: number, b: number) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function hashHue(text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 360;
}

function letterHue(letter: string) {
  const text = letter.trim();
  if (!text) return null;

  for (const entry of LETTER_HUES) {
    if (entry.pattern.test(text)) return entry.hue;
  }

  return hashHue(text);
}

function hslToHex({ h, s, l }: Hsl) {
  const hue = ((h % 360) + 360) % 360;
  const sat = clamp01(s);
  const light = clamp01(l);
  const chroma = (1 - Math.abs(2 * light - 1)) * sat;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = light - chroma / 2;
  let r = 0;
  let g = 0;
  let b = 0;

  if (hue < 60) [r, g, b] = [chroma, x, 0];
  else if (hue < 120) [r, g, b] = [x, chroma, 0];
  else if (hue < 180) [r, g, b] = [0, chroma, x];
  else if (hue < 240) [r, g, b] = [0, x, chroma];
  else if (hue < 300) [r, g, b] = [x, 0, chroma];
  else [r, g, b] = [chroma, 0, x];

  const toHex = (channel: number) =>
    Math.round((channel + m) * 255)
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function capsuleFill(
  weather: WeatherSnapshot | null | undefined,
  letter = "",
): Pick<CapsuleStyle, "fill" | "colorFrom" | "colorTo" | "colorAccent"> {
  const kind = weatherKind(weather);
  const saturation = WEATHER_SATURATION[kind];
  const weatherH = WEATHER_HUE[kind];
  const contentH = letterHue(letter);
  const useGradient =
    contentH != null && hueDiff(weatherH, contentH) >= HUE_GAP_FOR_GRADIENT;

  if (!useGradient) {
    const color = hslToHex({ h: weatherH, s: saturation, l: 0.52 });
    const accent = hslToHex({ h: weatherH, s: saturation, l: 0.72 });
    return {
      fill: "solid",
      colorFrom: color,
      colorTo: color,
      colorAccent: accent,
    };
  }

  return {
    fill: "gradient",
    colorFrom: hslToHex({ h: weatherH, s: saturation, l: 0.64 }),
    colorTo: hslToHex({ h: contentH, s: saturation, l: 0.42 }),
    colorAccent: hslToHex({ h: weatherH, s: saturation, l: 0.8 }),
  };
}

export function capsuleSurface(style: Pick<CapsuleStyle, "fill" | "colorFrom" | "colorTo">) {
  if (style.fill === "solid") return style.colorFrom;
  return `linear-gradient(160deg, ${style.colorFrom}, ${style.colorTo})`;
}

function weatherShape(weather: WeatherSnapshot | null): CapsuleShape {
  switch (weatherKind(weather)) {
    case "snow":
      return "flake";
    case "rain":
      return "drop";
    case "storm":
      return "drop";
    case "cloudy":
      return "cloud";
    case "humid":
      return "wave";
    case "hot":
      return "sun";
    case "cold":
      return "lantern";
    default:
      return "orb";
  }
}

export function fallbackCapsuleStyle(
  weather: WeatherSnapshot | null,
  letter?: string,
): CapsuleStyle {
  const condition = weather?.condition ?? "";
  const temperature = weather?.temperature ?? 20;
  const humidity = weather?.humidity ?? 50;
  const fill = capsuleFill(weather, letter);

  if (condition.includes("눈") || condition.includes("날림")) {
    return {
      phrase: "하얀 숨결이 오래 남을 날.",
      keywords: keywordsFromLetter(letter, ["눈", "고요"]),
      shape: "flake",
      ...fill,
    };
  }

  if (condition.includes("비") || condition.includes("소나기") || condition.includes("빗방울")) {
    return {
      phrase: "창문을 두드리는 오늘의 말.",
      keywords: keywordsFromLetter(letter, ["비", "생각"]),
      shape: "drop",
      ...fill,
    };
  }

  if (condition.includes("구름") || condition.includes("흐림")) {
    return {
      phrase: "구름 뒤에 잠시 숨은 빛.",
      keywords: keywordsFromLetter(letter, ["흐림", "기다림"]),
      shape: "cloud",
      ...fill,
    };
  }

  if (humidity >= 75) {
    return {
      phrase: "공기가 무겁고, 마음은 촉촉한 날.",
      keywords: keywordsFromLetter(letter, ["습기", "온기"]),
      shape: "wave",
      ...fill,
    };
  }

  if (temperature >= 28) {
    return {
      phrase: "햇살이 문장보다 먼저 도착한 날.",
      keywords: keywordsFromLetter(letter, ["더위", "빛"]),
      shape: "sun",
      ...fill,
    };
  }

  if (temperature <= 5) {
    return {
      phrase: "손이 시려도 온기를 남기는 날.",
      keywords: keywordsFromLetter(letter, ["추위", "온기"]),
      shape: "lantern",
      ...fill,
    };
  }

  return {
    phrase: "맑은 하루를 유리병에 담아 두어요.",
    keywords: keywordsFromLetter(letter, ["맑음", "기억"]),
    shape: weatherShape(weather),
    ...fill,
  };
}

function keywordsFromLetter(letter: string | undefined, extras: string[]) {
  const words = (letter ?? "")
    .split(/[^0-9A-Za-z가-힣]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && word.length <= 8)
    .slice(0, 3);

  return [...new Set([...words, ...extras])].slice(0, 5);
}

function inferredFill(colorFrom: string, colorTo: string): CapsuleFill {
  return colorFrom.toLowerCase() === colorTo.toLowerCase() ? "solid" : "gradient";
}

export function parseCapsuleStyle(
  value: unknown,
  weather: WeatherSnapshot | null,
  letter?: string,
): CapsuleStyle {
  const fallback = fallbackCapsuleStyle(weather, letter);
  if (!value || typeof value !== "object") return fallback;

  const raw = value as Record<string, unknown>;
  const keywords = Array.isArray(raw.keywords)
    ? raw.keywords
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 5)
    : fallback.keywords;

  const computed = weather || letter?.trim() ? capsuleFill(weather, letter) : null;
  const colorFrom = computed?.colorFrom ?? hexOr(raw.colorFrom, fallback.colorFrom);
  const colorTo = computed?.colorTo ?? hexOr(raw.colorTo, fallback.colorTo);

  return {
    phrase:
      typeof raw.phrase === "string" && raw.phrase.trim()
        ? raw.phrase.trim().slice(0, 48)
        : fallback.phrase,
    keywords: keywords.length > 0 ? keywords : fallback.keywords,
    shape: isShape(raw.shape) ? raw.shape : fallback.shape,
    fill: computed?.fill ?? inferredFill(colorFrom, colorTo),
    colorFrom,
    colorTo,
    colorAccent: computed?.colorAccent ?? hexOr(raw.colorAccent, fallback.colorAccent),
  };
}

export function styleFromRow(row: {
  phrase?: string | null;
  keywords?: string[] | null;
  shape?: string | null;
  color_from?: string | null;
  color_to?: string | null;
  color_accent?: string | null;
}): CapsuleStyle | null {
  if (
    !row.phrase &&
    !(row.keywords && row.keywords.length) &&
    !row.shape &&
    !row.color_from
  ) {
    return null;
  }

  return parseCapsuleStyle(
    {
      phrase: row.phrase,
      keywords: row.keywords ?? [],
      shape: row.shape,
      colorFrom: row.color_from,
      colorTo: row.color_to,
      colorAccent: row.color_accent,
    },
    null,
  );
}
