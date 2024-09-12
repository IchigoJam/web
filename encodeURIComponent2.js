export const encodeURIComponent2 = (s) => {
  s = encodeURIComponent(s);
  s = s.replace(/\(/g, "%28");
  s = s.replace(/\)/g, "%29");
  return s;
};
