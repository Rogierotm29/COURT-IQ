import { C } from "../theme";
import { ESPN_LOGO, TM } from "../data/teams";

export const tm = a => TM[a] || { color: C.accent, name: a || "?", conf: "W", div: "" };

export const logo = (abbr, sz = 32) => (
  <img
    src={`https://a.espncdn.com/i/teamlogos/nba/500/${ESPN_LOGO[abbr] || abbr.toLowerCase()}.png`}
    alt={abbr}
    style={{ width: sz, height: sz, objectFit: "contain" }}
    onError={e => { e.target.style.display = "none"; }}
  />
);