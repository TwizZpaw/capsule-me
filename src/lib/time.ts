export function isOpened(openAt: string, now = Date.now()) {
  return new Date(openAt).getTime() <= now;
}

export function getCountdownParts(openAt: string, now = Date.now()) {
  const remaining = Math.max(0, new Date(openAt).getTime() - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    opened: remaining === 0,
    days,
    hours,
    minutes,
    seconds,
  };
}

export function formatCountdown(openAt: string, now = Date.now()) {
  const parts = getCountdownParts(openAt, now);
  if (parts.opened) return "열 수 있어요";
  if (parts.days > 0) return `${parts.days}일 ${parts.hours}시간`;
  if (parts.hours > 0) return `${parts.hours}시간 ${parts.minutes}분`;
  if (parts.minutes > 0) return `${parts.minutes}분 ${parts.seconds}초`;
  return `${parts.seconds}초`;
}

export function formatOpenAt(openAt: string) {
  return new Date(openAt).toLocaleString("ko-KR", {
    dateStyle: "long",
    timeStyle: "short",
  });
}
