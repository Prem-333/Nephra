/** Format a session minute as "Xh YYm". */
export const timeLabel = (minute) =>
  `${Math.floor(minute / 60)}h ${String(Number((minute % 60).toFixed(1))).padStart(2, '0')}m`;
