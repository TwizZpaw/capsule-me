import type { WeatherSnapshot } from "@/lib/weather";

const KMA_BASE = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0";
const SEOUL_GRID = { nx: 60, ny: 127 };

const PTY_LABEL: Record<string, string> = {
  "1": "비",
  "2": "비/눈",
  "3": "눈",
  "4": "소나기",
  "5": "빗방울",
  "6": "빗방울눈날림",
  "7": "눈날림",
};

const SKY_LABEL: Record<string, string> = {
  "1": "맑음",
  "3": "구름많음",
  "4": "흐림",
};

type Grid = { nx: number; ny: number };

type KmaItem = {
  category?: string;
  obsrValue?: string;
  fcstValue?: string;
  fcstDate?: string;
  fcstTime?: string;
};

function kstParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: Number(value("hour")),
    minute: Number(value("minute")),
  };
}

function shiftHour(
  year: string,
  month: string,
  day: string,
  hour: number,
  delta: number,
) {
  const utc = Date.UTC(Number(year), Number(month) - 1, Number(day), hour - 9);
  const shifted = new Date(utc + delta * 60 * 60 * 1000);
  const parts = kstParts(shifted);
  return {
    date: `${parts.year}${parts.month}${parts.day}`,
    hour: parts.hour,
  };
}

function ncstBase() {
  const parts = kstParts();
  const hour = parts.minute < 10 ? parts.hour - 1 : parts.hour;
  const shifted = hour < 0 ? shiftHour(parts.year, parts.month, parts.day, 0, -1) : null;

  return {
    baseDate: shifted?.date ?? `${parts.year}${parts.month}${parts.day}`,
    baseTime: `${String(shifted?.hour ?? hour).padStart(2, "0")}00`,
  };
}

function fcstBase() {
  const parts = kstParts();
  const hour = parts.minute < 45 ? parts.hour - 1 : parts.hour;
  const shifted = hour < 0 ? shiftHour(parts.year, parts.month, parts.day, 0, -1) : null;

  return {
    baseDate: shifted?.date ?? `${parts.year}${parts.month}${parts.day}`,
    baseTime: `${String(shifted?.hour ?? hour).padStart(2, "0")}30`,
  };
}

export function toKmaGrid(lat: number, lon: number): Grid {
  const RE = 6371.00877;
  const GRID = 5.0;
  const SLAT1 = 30.0;
  const SLAT2 = 60.0;
  const OLON = 126.0;
  const OLAT = 38.0;
  const XO = 43;
  const YO = 136;
  const DEGRAD = Math.PI / 180.0;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn =
    Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
    Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = (re * sf) / Math.pow(ro, sn);

  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = (re * sf) / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  return {
    nx: Math.floor(ra * Math.sin(theta) + XO + 0.5),
    ny: Math.floor(ro - ra * Math.cos(theta) + YO + 0.5),
  };
}

function parseNumber(value: string | undefined) {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function conditionFrom(pty: string | undefined, sky: string | undefined) {
  if (pty && pty !== "0" && PTY_LABEL[pty]) {
    return PTY_LABEL[pty];
  }
  if (sky && SKY_LABEL[sky]) {
    return SKY_LABEL[sky];
  }
  return "맑음";
}

async function kmaGet(path: string, params: Record<string, string>) {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error("Missing DATA_GO_KR_SERVICE_KEY");
  }

  const url = new URL(`${KMA_BASE}${path}`);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", "1000");
  url.searchParams.set("dataType", "JSON");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  const text = await response.text();

  try {
    return JSON.parse(text) as {
      response?: {
        header?: { resultCode?: string; resultMsg?: string };
        body?: { items?: { item?: KmaItem | KmaItem[] } };
      };
    };
  } catch {
    throw new Error(text.slice(0, 180) || "기상청 응답을 읽지 못했어요.");
  }
}

function itemsOf(payload: Awaited<ReturnType<typeof kmaGet>>) {
  const items = payload.response?.body?.items?.item;
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

export async function getCurrentWeather(
  lat?: number,
  lon?: number,
): Promise<WeatherSnapshot | null> {
  const serviceKey = process.env.DATA_GO_KR_SERVICE_KEY;
  if (!serviceKey) {
    console.error("Missing DATA_GO_KR_SERVICE_KEY");
    return null;
  }

  const grid =
    lat != null &&
    lon != null &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= 32 &&
    lat <= 44 &&
    lon >= 124 &&
    lon <= 132
      ? toKmaGrid(lat, lon)
      : SEOUL_GRID;

  const ncst = ncstBase();
  const fcst = fcstBase();
  const gridParams = { nx: String(grid.nx), ny: String(grid.ny) };

  const [ncstPayload, fcstPayload] = await Promise.all([
    kmaGet("/getUltraSrtNcst", {
      ...gridParams,
      base_date: ncst.baseDate,
      base_time: ncst.baseTime,
    }),
    kmaGet("/getUltraSrtFcst", {
      ...gridParams,
      base_date: fcst.baseDate,
      base_time: fcst.baseTime,
    }),
  ]);

  const ncstCode = ncstPayload.response?.header?.resultCode;
  if (ncstCode && ncstCode !== "00") {
    throw new Error(ncstPayload.response?.header?.resultMsg || "기상청 호출에 실패했어요.");
  }

  const ncstByCategory = new Map<string, string>();
  for (const item of itemsOf(ncstPayload)) {
    if (item.category && item.obsrValue != null) {
      ncstByCategory.set(item.category, item.obsrValue);
    }
  }

  const sky = itemsOf(fcstPayload).find((item) => item.category === "SKY")?.fcstValue;

  const temperature = parseNumber(ncstByCategory.get("T1H"));
  const humidity = parseNumber(ncstByCategory.get("REH"));
  const condition = conditionFrom(ncstByCategory.get("PTY"), sky);

  if (temperature == null && humidity == null) {
    return null;
  }

  return { condition, temperature, humidity };
}
