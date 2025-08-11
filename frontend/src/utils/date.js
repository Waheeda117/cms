
// "YYYY-MM-DD" ko LOCAL Date banaye ga (UTC shift ke baghair)
const toLocalDate = (value) => {
  if (value instanceof Date) return value;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d); // ✅ local parse (no timezone shift)
  }
  return new Date(value);
};

// Local Date ko "YYYY-MM-DD" string me de (bina UTC shift)
export const toLocalISODate = (value) => {
  const date = toLocalDate(value);
  if (isNaN(date)) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

// Display helper (e.g., "Aug 11, 2025")
export const formatDate = (value) => {
  const date = toLocalDate(value); // ✅ yahan fix
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export default formatDate;
