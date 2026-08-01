// Placeholder data so the UI has something to render.
// Replace this with real API calls once the backend exists.

export const players = [
  {
    id: "1",
    name: "Jordan Mills",
    position: "Point Guard",
    teamId: "t1",
    age: 19,
    height: "6'1\"",
    verified: true,
    stats: {
      gamesPlayed: 22, minutes: 612, points: 348, assists: 187, rebounds: 96,
      offRebounds: 21, defRebounds: 75, steals: 54, blocks: 6, turnovers: 61, fouls: 40,
      fgm: 128, fga: 289, fgPct: 44.3, threeM: 41, threeA: 118, threePct: 34.7,
      ftm: 51, fta: 63, ftPct: 81.0,
    },
    highlights: [
      { title: "Season Highlight Reel", type: "youtube", url: "https://youtube.com" },
      { title: "Championship Final Clip", type: "youtube", url: "https://youtube.com" },
    ],
  },
  {
    id: "2",
    name: "Amara Okafor",
    position: "Shooting Guard",
    teamId: "t1",
    age: 20,
    height: "5'10\"",
    verified: true,
    stats: {
      gamesPlayed: 20, minutes: 580, points: 412, assists: 65, rebounds: 110,
      offRebounds: 30, defRebounds: 80, steals: 38, blocks: 4, turnovers: 44, fouls: 35,
      fgm: 150, fga: 320, fgPct: 46.9, threeM: 62, threeA: 155, threePct: 40.0,
      ftm: 50, fta: 58, ftPct: 86.2,
    },
    highlights: [
      { title: "Career Highlight Reel", type: "drive", url: "https://drive.google.com" },
    ],
  },
  {
    id: "3",
    name: "Devon Reyes",
    position: "Center",
    teamId: "t2",
    age: 21,
    height: "6'8\"",
    verified: false,
    stats: {
      gamesPlayed: 18, minutes: 490, points: 260, assists: 30, rebounds: 210,
      offRebounds: 90, defRebounds: 120, steals: 12, blocks: 45, turnovers: 38, fouls: 60,
      fgm: 105, fga: 190, fgPct: 55.3, threeM: 0, threeA: 2, threePct: 0,
      ftm: 50, fta: 80, ftPct: 62.5,
    },
    highlights: [],
  },
];

export const teams = [
  {
    id: "t1",
    name: "Riverside Hawks",
    city: "Riverside",
    coach: "Coach Marcus Ellington",
    record: { wins: 14, losses: 4 },
    rosterIds: ["1", "2"],
  },
  {
    id: "t2",
    name: "Northgate Wolves",
    city: "Northgate",
    coach: "Coach Priya Nair",
    record: { wins: 9, losses: 9 },
    rosterIds: ["3"],
  },
];