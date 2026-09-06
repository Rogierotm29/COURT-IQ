
export const getSeason = () => {
  const d = new Date();
  const year = d.getFullYear();
  // La temporada NBA arranca en octubre
  const start = d.getMonth() >= 9 ? year : year - 1;
  return `${start}-${String(start + 1).slice(2)}`;
};