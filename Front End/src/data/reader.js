export function normalizeQuranSearch(value) {
  return String(value)
    .toLowerCase()
    .replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d))
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .trim();
}
export function matchingSurahs(surahs, query) {
  const q = normalizeQuranSearch(query);
  return surahs.filter((s) =>
    `${normalizeQuranSearch(s.name)} ${s.id} ${normalizeQuranSearch(s.transliteration)}`.includes(
      q,
    ),
  );
}
export function readerWindow(total, start, count = 20) {
  const from = Math.max(1, Math.min(total, Math.floor(Number(start) || 1)));
  return { from, end: Math.min(total, from + Math.max(1, count) - 1) };
}
