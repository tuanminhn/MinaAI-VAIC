export function formatEstimatedMinutes(estimatedMinutes?: number): string | null {
  if (!estimatedMinutes || estimatedMinutes <= 0) {
    return null;
  }

  return `Khoảng ${estimatedMinutes} phút`;
}
