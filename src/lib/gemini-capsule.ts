import { GoogleGenAI, Type } from "@google/genai";
import {
  CAPSULE_SHAPES,
  capsuleFill,
  fallbackCapsuleStyle,
  parseCapsuleStyle,
  type CapsuleStyle,
} from "@/lib/capsule-style";
import type { WeatherSnapshot } from "@/lib/weather";

function getGeminiKey() {
  return process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
}

export async function generateCapsuleStyle(input: {
  weather: WeatherSnapshot | null;
  letter: string;
}): Promise<CapsuleStyle> {
  const fallback = fallbackCapsuleStyle(input.weather, input.letter);
  const apiKey = getGeminiKey();
  if (!apiKey) {
    return fallback;
  }

  const weatherLine = input.weather
    ? `${input.weather.condition}, ${input.weather.temperature ?? "?"}℃, 습도 ${input.weather.humidity ?? "?"}%`
    : "날씨 정보 없음";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `타임캡슐을 묻는 날의 분위기를 만들어 주세요.

날씨: ${weatherLine}
편지:
"""
${input.letter.slice(0, 1200)}
"""

규칙:
- phrase는 날씨·온도·습도에서 온 '그 날의 한 마디'. 한글 한 문장, 편지 내용을 인용하지 말 것.
- keywords는 편지 전문을 인용하지 않는 짧은 한글 키워드 3~5개. 봉인된 캡슐에서도 주제를 짐작할 수 있게.
- shape는 날씨 분위기에 맞는 형태 하나.
- 색은 서버에서 날씨색+편지색으로 맞추므로 만들지 말 것.`,
      config: {
        responseMimeType: "application/json",
        responseJsonSchema: {
          type: Type.OBJECT,
          properties: {
            phrase: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            shape: { type: Type.STRING, enum: [...CAPSULE_SHAPES] },
          },
          required: ["phrase", "keywords", "shape"],
        },
      },
    });

    const text = response.text;
    if (!text) return fallback;
    return {
      ...parseCapsuleStyle(JSON.parse(text), input.weather, input.letter),
      ...capsuleFill(input.weather, input.letter),
    };
  } catch (error) {
    console.error(error);
    return fallback;
  }
}
