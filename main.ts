// THE WORLD TODAY — front page of Thursday 26 November 2026.
// One 1024x1024 newspaper image: masthead, 3 hero stories, a pinned
// world map, and a two-column grid of 41 more stories (44 total),
// every story dated 26 Nov 2026 and verified from live news sources.
// Pure Node stdlib: own 5x7 bitmap font, own PNG encoder, no network.
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024;
const H = 1024;

// ---- palette ----
const PAPER: [number, number, number] = [247, 243, 234];
const INK: [number, number, number] = [26, 26, 26];
const NAVY: [number, number, number] = [22, 35, 63];
const RED: [number, number, number] = [185, 28, 28];
const WHITE: [number, number, number] = [255, 255, 255];
const GREY: [number, number, number] = [85, 85, 85]; // deck text: darkened after visual check, 1x grey was too faint
const LINE: [number, number, number] = [201, 194, 180];
const OCEAN: [number, number, number] = [207, 227, 245];
const LANDC: [number, number, number] = [74, 124, 89];
const GREEN: [number, number, number] = [47, 111, 79];

// ---- 5x7 bitmap font (rows of 5, '#' = ink) ----
const FONT: Record<string, string[]> = {
  "A": [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  "B": ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  "C": [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  "D": ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  "E": ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  "F": ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  "G": [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  "H": ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  "I": [".###.", "..#..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "J": ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  "K": ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  "L": ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  "M": ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  "N": ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  "O": [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "P": ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  "Q": [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  "R": ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  "S": [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  "T": ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  "U": ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  "V": ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  "W": ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  "X": ["#...#", "#...#", ".#.#.", "..#..", ".#.#.", "#...#", "#...#"],
  "Y": ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  "Z": ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", ".###."],
  "2": [".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", ".....", ".....", ".....", ".....", "....."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  ";": [".....", ".##..", ".##..", ".....", ".##..", "..#..", ".#..."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "...#.", "..#..", ".....", "..#.."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  "(": ["...#.", "..#..", ".#...", ".#...", ".#...", "..#..", "...#."],
  ")": [".#...", "..#..", "...#.", "...#.", "...#.", "..#..", ".#..."],
  "/": ["....#", "...#.", "...#.", "..#..", ".#...", ".#...", "#...."],
  "%": ["#...#", "#..#.", "...#.", "..#..", ".#...", "#..#.", "#...#"],
  "$": ["..#..", ".####", "#.#..", ".###.", "..#.#", "####.", "..#.."],
  "&": [".##..", "#..#.", "#..#.", ".#...", "#.#.#", "#..#.", ".##.#"],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "=": [".....", ".....", "#####", ".....", "#####", ".....", "....."],
  '"': [".#.#.", ".#.#.", ".....", ".....", ".....", ".....", "....."],
  "*": [".....", ".#.#.", "..#..", "#####", "..#..", ".#.#.", "....."],
  "_": [".....", ".....", ".....", ".....", ".....", ".....", "#####"],
  "[": [".###.", ".#...", ".#...", ".#...", ".#...", ".#...", ".###."],
  "]": [".###.", "...#.", "...#.", "...#.", "...#.", "...#.", ".###."],
  "<": ["...#.", "..#..", ".#...", "#....", ".#...", "..#..", "...#."],
  ">": [".#...", "..#..", "...#.", "....#", "...#.", "..#..", ".#..."],
  "@": [".###.", "#...#", "#.###", "#.#.#", "#.###", "#....", ".###."],
  "\u2022": [".....", ".....", ".###.", ".###.", ".###.", ".....", "....."],
};

// ---- stories (all first reported 26 Nov 2026, verified live) ----
const GRID: { h: string; d: string }[] = [
  { h: "US ECONOMY GREW 4.3% IN Q3", d: "FASTEST PACE IN THREE YEARS, BEA REVISES UP FROM 3.4%" },
  { h: "US INFLATION 3.8% IN OCTOBER", d: "PCE PRICE INDEX RISES; FED DECEMBER HIKE MORE LIKELY" },
  { h: "NVIDIA SLIDES AS AI SELL-OFF RESUMES", d: "HUANG DEFENDS NO SUCCESSION PLAN; SOFTBANK -15% IN TOKYO" },
  { h: "FIRST PAKISTANI ASTRONAUT JOINS CHINA", d: "MUHAMMAD ZEESHAN ALI TO FLY ON SHENZHOU-24 TO TIANGONG" },
  { h: "EUROPE-JAPAN PROBE REACHES MERCURY", d: "JOINT MISSION ARRIVES AFTER EIGHT-YEAR JOURNEY" },
  { h: "ASTEROID DEFENCE TEST REVEALS NEW CRATER", d: "CLOSE-UP IMAGES FROM EARTH'S PLANETARY DEFENCE TEST" },
  { h: "INDIA MARKS CONSTITUTION DAY", d: "SAMVIDHAN DIVAS: 26 NOVEMBER, 1949 CONSTITUTION ADOPTED" },
  { h: "INDIA: HUMAN CONTROL OVER AI WEAPONS", d: "NEW DELHI URGES HUMAN JUDGEMENT IN MILITARY AI" },
  { h: "INDIA PLEDGES RS 15,000 CRORE FOR NEPAL", d: "MODI AND NEPAL PM BALENDRA SHAH HOLD TALKS" },
  { h: "SHEIKH HASINA SEEKS RETURN DEC 16", d: "EX-BANGLADESH PM ASKS DHAKA TO ARRANGE COMEBACK" },
  { h: "BANGLADESH GARMENT WAGE UP 36%", d: "MINIMUM PAY RISES FOR ENTRY-LEVEL FACTORY WORKERS" },
  { h: "NORTH KOREA EXPELS SWISS DIPLOMAT", d: "PYONGYANG ORDERS SWITZERLAND TO CLOSE NEW OFFICE" },
  { h: "COLOMBIA MARKS 10 YEARS OF PEACE DEAL", d: "UN WARNS OF UNFINISHED COMMITMENTS A DECADE ON" },
  { h: "VENEZUELA DEBT PUT AT $237.5 BILLION", d: "GOVERNMENT PREPARES HISTORIC ECONOMIC RESTRUCTURING" },
  { h: "PETROBRAS UNVEILS $122BN ENERGY PLAN", d: "BRAZIL EXPANDS GLOBAL ENERGY AMBITIONS" },
  { h: "CANADA HOLDS INFLATION STRATEGY", d: "US CONSUMER CONFIDENCE NEARS TWO-YEAR HIGH" },
  { h: "AUSTRALIA-SOLOMON ISLANDS SECURITY PACT", d: "LANDMARK PARTNERSHIP SIGNED IN THE PACIFIC" },
  { h: "SUEZ CANAL REVENUES RECOVERING", d: "EGYPT SEES GRADUAL RETURN OF TRANSIT INCOME" },
  { h: "IRAN FACES DEEPENING FINANCIAL HARDSHIP", d: "ECONOMIC STRAIN GROWS, REPORTS SAY" },
  { h: "FRANCE SEEKS MINERAL INDEPENDENCE", d: "PARIS MOVES TO SECURE CRITICAL SUPPLIES" },
  { h: "BRITAIN PROBES NUCLEAR TEST LEGACY", d: "INQUIRY INTO HUMAN COST OF WEAPONS TESTING" },
  { h: "POLAND ALARMS AT AIRSPACE VIOLATIONS", d: "WARSAW RAISES SECURITY CONCERNS AGAIN" },
  { h: "RUSSIA RAISES DEFENCE SPENDING", d: "MOSCOW'S OWN FIGURES PUT UKRAINE WAR DEAD NEAR 500,000" },
  { h: "UKRAINE AND HUNGARY TALK ECONOMY", d: "KYIV AND BUDAPEST PURSUE RENEWED COOPERATION" },
  { h: "CAIRO TANKER FIRE KILLS AT LEAST 30", d: "FUEL TRUCK CRASH IGNITES BLAZE ON HIGHWAY RING ROAD" },
  { h: "COLOMBIA POLICE FREE 20 HOSTAGES", d: "SUPERMARKET SIEGE ENDS AFTER 17 HOURS" },
  { h: "SOUTH KOREA TO BOOST EV INDUSTRY", d: "SEOUL PREPARES NEW SUPPORT FOR ELECTRIC VEHICLES" },
  { h: "BARBADOS SETS AI FRAMEWORK DEADLINE", d: "CARIBBEAN AI RULES DUE BY FEBRUARY, UN URGES SAFETY" },
  { h: "THANKSGIVING: THREE NFL GAMES TODAY", d: "BEARS-LIONS, EAGLES-COWBOYS, CHIEFS-BILLS; DOG SHOW AT NOON" },
  { h: "US UNVEILS F-15EX FIGHTERS IN OKINAWA", d: "AIR FORCE SHOWS NEW JETS AT KADENA BASE" },
  { h: "FED BEIGE BOOK: MODEST GROWTH", d: "WAGE GAINS CONTINUE, PRICE PRESSURE PERSISTS" },
  { h: "TAIWAN SHARES FALL 1,927 POINTS", d: "NT DOLLAR WEAKENS PAST 33; US TARIFF PLAN WEIGHS" },
  { h: "US TIGHTENS REMOTE AI CHIP RULES", d: "THOUSANDS OF NVIDIA B300 GPUS SEEK NEW BUYERS" },
  { h: "SANOFI TO BUY INSMED FOR $41BN", d: "FRENCH DRUGMAKER'S BIGGEST DEAL IN 20 YEARS" },
  { h: "EU UNVEILS QUANTUM ACT", d: "BRUSSELS LAYS GROUNDWORK FOR EQUITY FUND" },
  { h: "UK TO TAKE PUBLIC CONTROL OF UTILITIES", d: "ENERGY AND WATER PLAN; PRICE CAP UP 26% FROM JANUARY" },
  { h: "GERMANY GROWTH REVISED DOWN TO 0.1%", d: "Q3 FIGURES WEAKEN FOR EUROPE'S BIGGEST ECONOMY" },
  { h: "AUSTRALIA INFLATION HITS 4.9%", d: "OCTOBER CPI CLIMBS; TRIMMED MEAN 3.8%" },
  { h: "IPL AUCTION DRAWS 1,220 PLAYERS", d: "SOORYAVANSHI SMASHES 204 OFF 53 BALLS VS UAE" },
  { h: "GUKESH DRAWS GAME 2 IN 20 MOVES", d: "WORLD CHESS TITLE FIGHT WITH SINDAROV IN GENEVA" },
  { h: "SIX DEAD IN PLANE CRASH OFF MISSISSIPPI", d: "TWO CHILDREN AMONG VICTIMS, OFFICIALS SAY" },
];

// World map as land runs [row, colStart, colEnd] on a 64x32 grid.
const LAND: [number, number, number][] = [
  [1, 21, 24],
  [2, 4, 10], [2, 21, 27], [2, 44, 52],
  [3, 3, 16], [3, 21, 28], [3, 30, 38], [3, 40, 60],
  [4, 2, 18], [4, 30, 39], [4, 40, 62],
  [5, 3, 19], [5, 30, 38], [5, 41, 63],
  [6, 4, 20], [6, 30, 38], [6, 42, 60],
  [7, 6, 20], [7, 30, 37], [7, 43, 58],
  [8, 8, 19], [8, 31, 36], [8, 44, 56],
  [9, 10, 18], [9, 31, 35], [9, 38, 42], [9, 45, 54],
  [10, 11, 17], [10, 29, 41], [10, 46, 52],
  [11, 12, 16], [11, 29, 40], [11, 48, 53],
  [12, 13, 15], [12, 30, 39], [12, 49, 54],
  [13, 18, 24], [13, 30, 38], [13, 50, 55],
  [14, 18, 25], [14, 31, 37], [14, 50, 55],
  [15, 18, 25], [15, 31, 36], [15, 48, 55],
  [16, 19, 24], [16, 32, 36], [16, 52, 58],
  [17, 19, 24], [17, 32, 35], [17, 52, 58],
  [18, 19, 23], [18, 32, 35], [18, 53, 57],
  [19, 20, 23], [19, 33, 35], [19, 53, 57],
  [20, 20, 22], [20, 33, 34], [20, 54, 56],
  [21, 20, 22], [21, 33, 34], [21, 54, 56],
  [22, 21, 21], [22, 33, 33],
  [23, 21, 21],
  [24, 21, 21],
  [25, 21, 21],
];

// ---- pixel buffer ----
const px = new Uint8Array(W * H * 3);
function setPx(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || x >= W || y < 0 || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}
function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) setPx(xx, yy, c);
  }
}
function rectOutline(x: number, y: number, w: number, h: number, c: [number, number, number], t = 1): void {
  fillRect(x, y, w, t, c);
  fillRect(x, y + h - t, w, t, c);
  fillRect(x, y, t, h, c);
  fillRect(x + w - t, y, t, h, c);
}
function hline(x0: number, x1: number, y: number, c: [number, number, number], t = 1): void {
  fillRect(x0, y, x1 - x0, t, c);
}
function vline(x: number, y0: number, y1: number, c: [number, number, number], t = 1): void {
  fillRect(x, y0, t, y1 - y0, c);
}
function disc(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let dy = -r; dy <= r; dy++) {
    const dx = Math.floor(Math.sqrt(r * r - dy * dy));
    fillRect(cx - dx, cy + dy, 2 * dx + 1, 1, c);
  }
}
function ring(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let a = 0; a < 360; a += 2) {
    const rad = (a * Math.PI) / 180;
    setPx(Math.round(cx + r * Math.cos(rad)), Math.round(cy + r * Math.sin(rad)), c);
    setPx(Math.round(cx + r * Math.cos(rad)) + 1, Math.round(cy + r * Math.sin(rad)), c);
  }
}
function text(str: string, x: number, y: number, s: number, c: [number, number, number]): void {
  let cx = x;
  for (const ch of str) {
    const g = FONT[ch] ?? FONT["?"];
    for (let r = 0; r < 7; r++) {
      for (let col = 0; col < 5; col++) {
        if (g[r][col] === "#") fillRect(cx + col * s, y + r * s, s, s, c);
      }
    }
    cx += 6 * s;
  }
}
function textW(str: string, s: number): number {
  return str.length * 6 * s;
}

// ---- PNG encoder (zlib deflate, CRC32) ----
const CRC_TABLE: number[] = (() => {
  const t: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function encodePNG(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0; // filter: none
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = deflateSync(raw, { level: 6 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ================= layout =================
fillRect(0, 0, W, H, PAPER);

// ---- masthead ----
fillRect(0, 0, W, 92, NAVY);
text("THE WORLD TODAY", 24, 20, 4, WHITE);
text("THURSDAY 26 NOVEMBER 2026", 24, 58, 2, WHITE);
// globe icon right of the date line
ring(700, 46, 28, WHITE);
hline(672, 728, 46, WHITE);
vline(700, 18, 74, WHITE);
text("44 STORIES", 800, 22, 2, WHITE);
text("6 CONTINENTS", 800, 52, 2, WHITE);
fillRect(0, 92, W, 4, RED);

// ---- hero: tariffs (big card, left) ----
fillRect(16, 100, 484, 200, WHITE);
rectOutline(16, 100, 484, 200, INK, 2);
text("TRADE WAR", 32, 114, 2, RED);
text("TRUMP PROPOSES NEW", 32, 140, 3, INK);
text("TARIFFS ON 14", 32, 164, 3, INK);
text("PARTNERS", 32, 188, 3, INK);
text("US PLAN HITS CHINA, EU,", 32, 224, 2, INK);
text("JAPAN AND INDIA", 32, 242, 2, INK);
// rising-bars icon
fillRect(404, 250, 16, 30, RED);
fillRect(428, 225, 16, 55, NAVY);
fillRect(452, 200, 16, 80, GREEN);
hline(396, 480, 282, INK, 2);

// ---- hero: Houthis (right, top) ----
fillRect(516, 100, 492, 96, WHITE);
rectOutline(516, 100, 492, 96, INK, 2);
text("ENERGY", 532, 112, 2, RED);
text("HOUTHIS CLAIM STRIKE ON", 532, 132, 2, INK);
text("SAUDI REFINERY", 532, 148, 2, INK);
text("BRENT CRUDE TOPS $94 AS GULF FEARS RISE", 532, 172, 1, INK);

// ---- hero: Macy's parade (right, bottom) ----
fillRect(516, 204, 492, 96, WHITE);
rectOutline(516, 204, 492, 96, INK, 2);
text("NEW YORK", 532, 216, 2, RED);
text("MACY'S 100TH PARADE", 532, 236, 2, INK);
text("POSTPONED BY STORM", 532, 252, 2, INK);
text("CENTENNIAL PARADE MOVES TO SATURDAY NOV 28", 532, 276, 1, INK);

// ---- map strip ----
text("AROUND THE WORLD", 16, 312, 2, INK);
text("BY THE NUMBERS", 420, 312, 2, INK);
// map: ocean + land, 6px x 3px cells at (16, 330)
fillRect(16, 330, 384, 96, OCEAN);
rectOutline(16, 330, 384, 96, INK, 1);
for (const [row, c0, c1] of LAND) {
  fillRect(16 + c0 * 6, 330 + row * 3, (c1 - c0 + 1) * 6, 3, LANDC);
}
// pins: Washington, Riyadh, New York
disc(16 + 14 * 6 + 3, 330 + 8 * 3 + 1, 5, WHITE);
disc(16 + 14 * 6 + 3, 330 + 8 * 3 + 1, 3, RED);
disc(16 + 41 * 6 + 3, 330 + 11 * 3 + 1, 5, WHITE);
disc(16 + 41 * 6 + 3, 330 + 11 * 3 + 1, 3, RED);
disc(16 + 17 * 6 + 3, 330 + 8 * 3 + 1, 5, WHITE);
disc(16 + 17 * 6 + 3, 330 + 8 * 3 + 1, 3, RED);
// stat boxes (2x2) on the right of the map
const STATS: [string, string][] = [
  ["44", "STORIES TODAY"],
  ["6", "CONTINENTS"],
  ["14", "TRADE PARTNERS"],
  ["100", "TH MACY'S PARADE"],
];
for (let i = 0; i < 4; i++) {
  const bx = 420 + (i % 2) * 304;
  const by = 336 + Math.floor(i / 2) * 52;
  fillRect(bx, by, 284, 44, WHITE);
  rectOutline(bx, by, 284, 44, GREY, 1);
  text(STATS[i][0], bx + 12, by + 11, 3, RED);
  text(STATS[i][1], bx + 12 + textW(STATS[i][0], 3) + 14, by + 18, 1, INK);
}

// ---- story grid: 2 columns x 21 rows ----
hline(16, 1008, 452, LINE, 1);
vline(512, 460, 985, LINE, 1);
for (let i = 0; i < GRID.length; i++) {
  const col = i < 21 ? 0 : 1;
  const row = i < 21 ? i : i - 21;
  const x = col === 0 ? 16 : 524;
  const y = 460 + row * 25;
  text(GRID[i].h, x, y, 2, INK);
  text(GRID[i].d, x, y + 15, 1, GREY);
  hline(x, x + 484, y + 23, LINE, 1);
}

// ---- footer ----
const FOOT = "THE WORLD TODAY \u2022 THURSDAY 26 NOVEMBER 2026 \u2022 ALL STORIES FIRST REPORTED 26 NOV 2026";
text(FOOT, Math.floor((W - textW(FOOT, 1)) / 2), 1002, 1, INK);

// ================= write =================
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), encodePNG());
