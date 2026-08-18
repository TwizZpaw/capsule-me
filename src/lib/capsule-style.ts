import type { WeatherSnapshot } from "@/lib/weather";

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

export type CapsuleStyle = {
  phrase: string;
  keywords: string[];
  shape: CapsuleShape;
  colorFrom: string;
  colorTo: string;
  colorAccent: string;
};

const HEX = /^#([0-9a-fA-F]{6})$/;

function isShape(value: unknown): value is CapsuleShape {
  return CAPSULE_SHAPES.includes(value as CapsuleShape);
}

function hexOr(value: unknown, fallback: string) {
  return typeof value === "string" && HEX.test(value) ? value : fallback;
}

export function fallbackCapsuleStyle(
  weather: WeatherSnapshot | null,
  letter?: string,
): CapsuleStyle {
  const condition = weather?.condition ?? "";
  const temperature = weather?.temperature ?? 20;
  const humidity = weather?.humidity ?? 50;

  if (condition.includes("눈") || condition.includes("날림")) {
    return {
      phrase: "하얀 숨결이 오래 남을 날.",
      keywords: keywordsFromLetter(letter, ["눈", "고요"]),
      shape: "flake",
      colorFrom: "#e8f1ff",
      colorTo: "#7ea0c8",
      colorAccent: "#f8fbff",
    };
  }

  if (condition.includes("비") || condition.includes("소나기") || condition.includes("빗방울")) {
    return {
      phrase: "창문을 두드리는 오늘의 말.",
      keywords: keywordsFromLetter(letter, ["비", "생각"]),
      shape: "drop",
      colorFrom: "#7ea6d6",
      colorTo: "#1e3a5f",
      colorAccent: "#c5e1ff",
    };
  }

  if (condition.includes("구름") || condition.includes("흐림")) {
    return {
      phrase: "구름 뒤에 잠시 숨은 빛.",
      keywords: keywordsFromLetter(letter, ["흐림", "기다림"]),
      shape: "cloud",
      colorFrom: "#c9d3df",
      colorTo: "#5d6b7c",
      colorAccent: "#eef3f8",
    };
  }

  if (humidity >= 75) {
    return {
      phrase: "공기가 무겁고, 마음은 촉촉한 날.",
      keywords: keywordsFromLetter(letter, ["습기", "온기"]),
      shape: "wave",
      colorFrom: "#7fd0c6",
      colorTo: "#1f5d58",
      colorAccent: "#d7fff6",
    };
  }

  if (temperature >= 28) {
    return {
      phrase: "햇살이 문장보다 먼저 도착한 날.",
      keywords: keywordsFromLetter(letter, ["더위", "빛"]),
      shape: "sun",
      colorFrom: "#ffd36b",
      colorTo: "#e36a2d",
      colorAccent: "#fff4c8",
    };
  }

  if (temperature <= 5) {
    return {
      phrase: "손이 시려도 온기를 남기는 날.",
      keywords: keywordsFromLetter(letter, ["추위", "온기"]),
      shape: "lantern",
      colorFrom: "#f3c98b",
      colorTo: "#7a3b16",
      colorAccent: "#ffe7c2",
    };
  }

  return {
    phrase: "맑은 하루를 유리병에 담아 두어요.",
    keywords: keywordsFromLetter(letter, ["맑음", "기억"]),
    shape: "orb",
    colorFrom: "#f6d365",
    colorTo: "#fda085",
    colorAccent: "#fff6d8",
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

  return {
    phrase:
      typeof raw.phrase === "string" && raw.phrase.trim()
        ? raw.phrase.trim().slice(0, 48)
        : fallback.phrase,
    keywords: keywords.length > 0 ? keywords : fallback.keywords,
    shape: isShape(raw.shape) ? raw.shape : fallback.shape,
    colorFrom: hexOr(raw.colorFrom, fallback.colorFrom),
    colorTo: hexOr(raw.colorTo, fallback.colorTo),
    colorAccent: hexOr(raw.colorAccent, fallback.colorAccent),
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
