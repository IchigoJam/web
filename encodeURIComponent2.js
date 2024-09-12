const encs = "()*";

const fix02 = (s) => s.length == 1 ? "0" + s : s;

export const encodeURIComponent2 = (s) => {
  if (!s) return s;
  s = encodeURIComponent(s);
  for (const c of encs) {
    const ch = "%" + fix02(c.charCodeAt(0).toString(16));
    s = s.replace(new RegExp("\\" + c, "g"), ch);
    console.log(c, ch);
  }
  return s;
};
