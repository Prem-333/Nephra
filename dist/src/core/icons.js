// SVG icon registry — path data for all inline icons used in the workspace.
export const icons = {
  grid:     'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
  pulse:    'M2 12h4l3-8 5 16 3-8h5',
  flask:    'M9 3h6M10 3v7L4 20h16l-6-10V3M8 15h8',
  chart:    'M4 3v17h17M8 15l4-5 4 2 5-7',
  file:     'M6 3h8l4 4v14H6zM14 3v5h4M9 12h6M9 16h6',
  users:    'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M17 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.8M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  alert:    'M12 3 2 21h20L12 3zM12 9v5M12 18h.01',
  clock:    'M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
  download: 'M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4',
  search:   'M21 21l-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',
  play:     'm8 4 12 8-12 8V4',
  pause:    'M8 4v16M16 4v16',
  check:    'm5 12 4 4L20 5',
  database: 'M20 6c0 2-16 2-16 0s16-2 16 0v12c0 3-16 3-16 0V6M4 12c0 3 16 3 16 0',
  shield:   'm12 2 9 4v6c0 6-9 10-9 10S3 18 3 12V6l9-4',
  settings: 'M4 6h16M4 12h16M4 18h16M8 3v6M16 9v6M10 15v6',
};

/** Render an inline SVG icon by key name. */
export const icon = (key) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${icons[key] || icons.pulse}"/></svg>`;
