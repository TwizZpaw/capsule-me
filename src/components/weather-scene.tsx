"use client";

import { weatherKind, type WeatherKind, type WeatherSnapshot } from "@/lib/weather";

const SKY: Record<WeatherKind, { from: string; to: string; glow: string }> = {
  clear: { from: "#7ec8ff", to: "#ffe7b3", glow: "rgba(255, 236, 170, 0.7)" },
  cloudy: { from: "#8b9aab", to: "#d5dde6", glow: "rgba(255,255,255,0.35)" },
  rain: { from: "#3e5368", to: "#87a0b5", glow: "rgba(160, 190, 220, 0.4)" },
  snow: { from: "#c5d7ec", to: "#f7fbff", glow: "rgba(255,255,255,0.8)" },
  storm: { from: "#232833", to: "#5b6b7c", glow: "rgba(180, 200, 255, 0.25)" },
  humid: { from: "#5f9e97", to: "#d6efe8", glow: "rgba(180, 255, 230, 0.4)" },
  hot: { from: "#ff9a3c", to: "#ffd36b", glow: "rgba(255, 220, 120, 0.65)" },
  cold: { from: "#7f93b3", to: "#d7e2f2", glow: "rgba(210, 230, 255, 0.55)" },
};

export function WeatherScene({
  weather,
  className = "",
  children,
}: {
  weather: WeatherSnapshot | null | undefined;
  className?: string;
  children?: React.ReactNode;
}) {
  const kind = weatherKind(weather);
  const sky = SKY[kind];

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(180deg, ${sky.from} 0%, ${sky.to} 72%, #efe6d6 100%)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-56"
        style={{
          background: `radial-gradient(circle at 50% 0%, ${sky.glow}, transparent 64%)`,
        }}
      />
      <WeatherMotion kind={kind} />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

function WeatherMotion({ kind }: { kind: WeatherKind }) {
  if (kind === "rain" || kind === "storm") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: kind === "storm" ? 48 : 34 }, (_, index) => (
          <span
            key={index}
            className="weather-fall absolute top-0 w-px rounded-full bg-white/70"
            style={{
              left: `${(index * 97) % 100}%`,
              height: kind === "storm" ? 22 : 16,
              opacity: 0.45,
              ["--fall-duration" as string]: `${0.9 + (index % 7) * 0.18}s`,
              ["--fall-delay" as string]: `${(index % 11) * -0.2}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (kind === "snow") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 36 }, (_, index) => (
          <span
            key={index}
            className="weather-fall absolute top-0 rounded-full bg-white"
            style={{
              left: `${(index * 83) % 100}%`,
              width: 4 + (index % 4),
              height: 4 + (index % 4),
              ["--fall-duration" as string]: `${4 + (index % 8) * 0.7}s`,
              ["--fall-delay" as string]: `${(index % 13) * -0.4}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (kind === "cloudy" || kind === "humid") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[18, 42, 68].map((top, index) => (
          <span
            key={top}
            className="weather-drift absolute h-24 w-[42vw] rounded-full bg-white/30 blur-2xl"
            style={{
              top: `${top}%`,
              left: `${index * 18}%`,
              ["--drift-duration" as string]: `${22 + index * 6}s`,
              ["--drift-delay" as string]: `${index * -4}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (kind === "hot") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <span
          className="absolute left-1/2 top-[-4rem] size-64 -translate-x-1/2 rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(255,245,180,0.9) 0%, rgba(255,170,70,0.2) 46%, transparent 70%)",
            animation: "weather-pulse 4s ease-in-out infinite",
          }}
        />
        {Array.from({ length: 6 }, (_, index) => (
          <span
            key={index}
            className="absolute inset-x-[20%] h-24"
            style={{
              top: `${20 + index * 12}%`,
              background:
                "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
              animation: `weather-shimmer ${2.4 + index * 0.3}s ease-in-out infinite`,
              animationDelay: `${index * 0.2}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (kind === "cold") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={index}
            className="weather-fall absolute top-0 bg-white/80"
            style={{
              left: `${(index * 53) % 100}%`,
              width: 2,
              height: 10,
              ["--fall-duration" as string]: `${3.2 + (index % 5) * 0.4}s`,
              ["--fall-delay" as string]: `${(index % 9) * -0.3}s`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="absolute left-[12%] top-[-3rem] size-72 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(255,244,180,0.95) 0%, rgba(255,210,90,0.25) 42%, transparent 68%)",
        }}
      />
      <span
        className="absolute left-[12%] top-8 size-48 origin-center"
        style={{
          background:
            "conic-gradient(from 0deg, transparent 0 12deg, rgba(255,255,220,0.28) 12deg 14deg, transparent 14deg 45deg)",
          animation: "weather-spin 48s linear infinite",
          borderRadius: "9999px",
        }}
      />
    </div>
  );
}
