// Room constructor shorthand
const R = (name, x, y, w, h, type) => ({ name, x, y, w, h, type });

export const HEAT_STOPS = [
  [0,    [10, 120, 255]],
  [0.22, [0,  210, 180]],
  [0.45, [60, 255,  60]],
  [0.65, [255,220,   0]],
  [0.82, [255,100,   0]],
  [1,    [255,  0,  80]]
];

/*
  Campus layout (top-down):
      [ F — top-left ]    [ B — top-right ]
               [ H — central hub  ]
      [ G — bot-left ]    [ C — bot-right ]
*/
export const CAMPUS_BLOCKS = [
  {
    id: "F", label: "Block F\nSust. Energy", color: "#e91e63",
    shape: [
      [32,  42], [326, 42],
      [326, 148],[220, 148],
      [220, 215],[32,  215]
    ],
    floors: 6,
    usage: 0.91, dwell: 0.82, qr: 0.94, success: 0.88,
    sessions: 2540, avgDwell: 465, qrCount: 48, successRate: 88,
    description: "Sustainable Energy Technology Excellence Center — Wind Turbine & Renewable Energy Array"
  },
  {
    id: "B", label: "Block B\nAI & Robotics", color: "#2f7df6",
    shape: [
      [426, 42], [752, 42],
      [752, 148],[714, 148],
      [714, 215],[686, 215],
      [686, 255],[618, 255],
      [618, 215],[426, 215]
    ],
    floors: 5,
    usage: 0.92, dwell: 0.85, qr: 0.88, success: 0.90,
    sessions: 2180, avgDwell: 512, qrCount: 36, successRate: 90,
    description: "AI & Robotics Excellence Center — Granite Elevator Lobby, Modular Research Labs"
  },
  {
    id: "H", label: "Block H\nCentral Lab", color: "#546e7a",
    shape: [
      [326, 148],[426, 148],
      [426, 368],[326, 368]
    ],
    floors: 6,
    usage: 0.96, dwell: 0.91, qr: 0.87, success: 0.87,
    sessions: 3240, avgDwell: 680, qrCount: 55, successRate: 87,
    description: "Central Laboratory Hub — G+5, 1,648 m² per floor, Polycarbonate Curtain-Wall Entrance"
  },
  {
    id: "G", label: "Block G\nNuclear Rct.", color: "#9c27b0",
    shape: [
      [32, 215],[220, 215],
      [220, 422],[32,  422]
    ],
    floors: 4,
    usage: 0.76, dwell: 0.79, qr: 0.70, success: 0.91,
    sessions: 980, avgDwell: 495, qrCount: 22, successRate: 91,
    description: "Nuclear Reactor Excellence Center — Wide Granite Lobby, Executive Meeting Room, Porcelain Offices"
  },
  {
    id: "C", label: "Block C\nHPC & Data", color: "#00bcd4",
    shape: [
      [426, 258],[752, 258],
      [752, 432],[426, 432]
    ],
    floors: 6,
    usage: 0.80, dwell: 0.88, qr: 0.78, success: 0.86,
    sessions: 1640, avgDwell: 580, qrCount: 30, successRate: 86,
    description: "HPC & Big Data Analytics — Underground Parking (CAR #61), HPC Computing Floors"
  }
];

export const BLOCK_FLOOR_PLANS = {

  H: Array.from({ length: 6 }, (_, i) => ({
    label: i === 0 ? "Ground Floor — Main Spine" : `Floor ${i} — Circulation Spine`,
    rooms: [
      R("Pedestrian Lobby — West Wing Entry",  20,  60, 230, 210, "lobby"),
      R("Pedestrian Lobby — East Wing Entry", 750,  60, 230, 210, "lobby"),
      R("N-S Cross Corridor",                 456,  60,  88, 600, "corridor"),
      R("E-W Circulation Spine",               20, 290, 960,  80, "corridor"),
      R("Stairwell A (NW)",                    20, 380, 115, 150, "stair"),
      R("Elevator Core A",                    145, 380, 110, 150, "elevator"),
      R("Vertical Service Core A",            265, 380, 100, 150, "service"),
      R("Vertical Service Core B",            635, 380, 100, 150, "service"),
      R("Elevator Core B",                    745, 380, 110, 150, "elevator"),
      R("Stairwell B (NE)",                   865, 380, 115, 150, "stair"),
      R("Sanitary Block (West)",               20, 540, 230, 120, "toilet"),
      R("Sanitary Block (East)",              750, 540, 230, 120, "toilet"),
    ]
  })),

  B: [
    {
      label: "Level 1 — Ground Floor (Administrative & Entry)",
      rooms: [
        R("Main Entrance Lobby  115.00 m²",        20,  60, 390, 280, "lobby"),
        R("Director of Research Center  28.60 m²", 420,  60, 165, 155, "office"),
        R("Deputy Director Office  29.52 m²",      595,  60, 165, 155, "office"),
        R("Secretary Office Cell 1  16.39 m²",     420, 225, 100, 130, "office"),
        R("Secretary Office Cell 2  18.72 m²",     530, 225, 115, 130, "office"),
        R("Stairwell",                             770,  60, 105, 155, "stair"),
        R("Elevator Core",                         885,  60, 115, 200, "elevator"),
        R("Support Staff Suite A  63.51 m²",        20, 350, 340, 165, "office"),
        R("Support Staff Suite B  70.09 m²",       370, 350, 375, 165, "office"),
        R("Ladies' Toilet  14.30 m²",               20, 525, 130, 100, "toilet"),
        R("Gent's Toilet  12.40 m²",               160, 525, 115, 100, "toilet"),
        R("Disabled Toilet  4.41 m²",              285, 525,  80, 100, "toilet"),
        R("Janitor Room  4.35 m²",                 375, 525,  78, 100, "service"),
        R("Main Corridor",                          20, 635, 960,  45, "corridor"),
      ]
    },
    ...["Level 2 — Research Operations & Breakout Deck",
        "Level 3 — Advanced Computing & Collaboration Deck",
        "Level 4 — Analytics & Team Briefing Floor"].map((label) => ({
      label,
      rooms: [
        R("Central Floor Lobby  115.00 m²",        700,  60, 280, 345, "lobby"),
        R("Main Interactive Meeting Room  110.98 m²", 20,  60, 670, 280, "meeting"),
        R("Research Office Type 1  53.21 m²",       20, 350, 295, 170, "office"),
        R("Research Office Type 2  64.91 m²",      325, 350, 365, 175, "office"),
        R("Stairwell",                             700, 415, 110, 145, "stair"),
        R("Elevator Core",                         820, 415, 130, 145, "elevator"),
        R("Ladies' Toilet  14.30 m²",               20, 530, 130, 100, "toilet"),
        R("Gent's Toilet  12.40 m²",               160, 530, 115, 100, "toilet"),
        R("Disabled Toilet  4.41 m²",              285, 530,  80, 100, "toilet"),
        R("Janitor Room  4.35 m²",                 375, 530,  78, 100, "service"),
        R("Core Corridor",                          20, 638, 960,  42, "corridor"),
      ]
    })),
    {
      label: "Level 5 — Heavy Robotics & AI Testing Arena",
      rooms: [
        R("Primary Robotics & AI Testing Field  1,766.94 m²", 20, 60, 820, 460, "lab"),
        R("Central Floor Lobby  115.00 m²",        850,  60, 130, 295, "lobby"),
        R("Stairwell",                             850, 365, 110, 115, "stair"),
        R("Elevator Core",                         850, 490, 130, 110, "elevator"),
        R("Ladies' Toilet  14.30 m²",               20, 530, 130,  90, "toilet"),
        R("Gent's Toilet  12.40 m²",               160, 530, 115,  90, "toilet"),
        R("Disabled Toilet  4.41 m²",              285, 530,  80,  90, "toilet"),
        R("Janitor Room  4.35 m²",                 375, 530,  78,  90, "service"),
        R("Main Corridor",                          20, 630, 960,  50, "corridor"),
      ]
    }
  ],

  C: [
    ...[-1.2, -1.1].map((lvl, li) => ({
      label: `Level ${lvl} — Underground Parking ${li === 0 ? "(Lower)" : "(Upper)"}`,
      rooms: [
        R(li === 0 ? "Vehicle Ramp — Descent from Level −1.1" : "Vehicle Ramp Entry (from Ground)",
          20, 60, 200, 170, "ramp"),
        R("Enclosed Parking Field — Slots #1–61", 20, 240, 960, 400, "parking"),
        ...(() => {
          const slots = [];
          for (let row = 0; row < 7; row++) {
            for (let col = 0; col < 9; col++) {
              const n = row * 9 + col + 1;
              if (n > 61) break;
              slots.push(R(`#${n}`, 28 + col * 104, 250 + row * 54, 96, 46, "parkslot"));
            }
          }
          return slots;
        })()
      ]
    })),
    ...Array.from({ length: 6 }, (_, i) => ({
      label: i === 0 ? "Ground Floor — HPC Computing" : `Floor ${i} — HPC Computing`,
      rooms: [
        R("HPC Computing Laboratory  1,067 m²",    20,  60, 710, 380, "lab"),
        R("Primary E-W Corridor  65 m",             20, 448, 710,  65, "corridor"),
        R("Secondary N-S Corridor  92 m",           730,  60,  70, 520, "corridor"),
        R("Stairwell (N)",                          810,  60, 130, 165, "stair"),
        R("Elevator Core",                          810, 235, 130, 165, "elevator"),
        R("Stairwell (S)",                          810, 410, 130, 165, "stair"),
        R("Ladies' Restroom  14 m²",                20, 523, 140,  90, "toilet"),
        R("Gents' Restroom  12 m²",                170, 523, 130,  90, "toilet"),
        R("Disabled WC  4 m²",                     310, 523,  85,  90, "toilet"),
        R("Janitor Room  4 m²",                    405, 523,  80,  90, "service"),
        R("Balcony E  8 m²",                       810, 585, 170,  75, "balcony"),
        R("Balcony W  8 m²",                        20, 620, 130,  60, "balcony"),
      ]
    }))
  ],

  F: Array.from({ length: 7 }, (_, i) => ({
    label: i === 0 ? "Ground Floor" : `Floor ${i}`,
    rooms: [
      R("Sustainable Energy Research Laboratory  1,080 m²", 20, 60, 680, 390, "lab"),
      R("Technical Reference Library  121 m²",    710,  60, 270, 210, "library"),
      R("Briefing & Meeting Room  113 m²",         710, 280, 270, 170, "meeting"),
      R("Main Circulation Hallway  65 m²",          20, 460, 680,  70, "corridor"),
      R("Gas Shaft ↑",                             710, 460,  90,  70, "shaft"),
      R("Electrical Riser ↑",                      810, 460,  90,  70, "shaft"),
      R("SN Duct ↑",                               910, 460,  70,  70, "shaft"),
      R("Ladies' Toilet  14 m²",                    20, 540, 145, 100, "toilet"),
      R("Gents' Toilet  12 m²",                    175, 540, 135, 100, "toilet"),
      R("Disabled WC  4 m²",                       320, 540,  90, 100, "toilet"),
      R("Janitor  4 m²",                           420, 540,  85, 100, "service"),
      R("Escape Balcony  16 m²",                   515, 540, 125, 100, "balcony"),
      R("Elevator Core",                           710, 540, 110, 110, "elevator"),
      R("Stairwell",                               830, 540, 150, 110, "stair"),
    ]
  })),

  G: [
    {
      label: "Ground Floor — Assembly, Library & Lobby",
      rooms: [
        R("Main Level Lobby  123 m²",               20,  60, 305, 240, "lobby"),
        R("Executive Meeting Room  108 m²",         335,  60, 290, 240, "meeting"),
        R("Reactor Library  119 m²",                635,  60, 345, 240, "library"),
        R("Main Thoroughfare Corridor",              20, 310, 960,  70, "corridor"),
        R("Stairwell (W)",                           20, 390, 115, 160, "stair"),
        R("Elevator Core",                          145, 390, 115, 160, "elevator"),
        R("Gas Shaft Riser ↑",                      270, 390,  80, 160, "shaft"),
        R("Electrical Shaft Riser ↑",               360, 390,  80, 160, "shaft"),
        R("SN/ME Shaft ↑",                          450, 390,  80, 160, "shaft"),
        R("Ladies' Toilet  14 m²",                  540, 390, 135,  95, "toilet"),
        R("Gents' Toilet  12 m²",                   685, 390, 125,  95, "toilet"),
        R("Disabled WC  4 m²",                      820, 390,  85,  95, "toilet"),
        R("Janitor  4 m²",                          915, 390,  65,  95, "service"),
        R("Stairwell (E)",                          865, 558, 115, 130, "stair"),
      ]
    },
    ...Array.from({ length: 3 }, (_, i) => ({
      label: `Floor ${i + 1} — Researcher Offices`,
      rooms: [
        R("Office A  44 m²",   20,  60, 155, 185, "office"),
        R("Office B  43 m²",  185,  60, 155, 185, "office"),
        R("Office C  42 m²",  350,  60, 155, 185, "office"),
        R("Office D  44 m²",  515,  60, 155, 185, "office"),
        R("Office E  42 m²",  680,  60, 155, 185, "office"),
        R("Wrap-around Balcony  27 m²", 845, 60, 135, 185, "balcony"),
        R("Central Corridor",  20, 255, 960,  70, "corridor"),
        R("Office F  43 m²",   20, 335, 155, 185, "office"),
        R("Office G  44 m²",  185, 335, 155, 185, "office"),
        R("Office H  42 m²",  350, 335, 155, 185, "office"),
        R("Gas Shaft ↑",       515, 335,  80, 155, "shaft"),
        R("Electrical Shaft ↑",605, 335,  80, 155, "shaft"),
        R("SN/ME Shaft ↑",     695, 335,  80, 155, "shaft"),
        R("Ladies'  14 m²",    785, 335, 130,  90, "toilet"),
        R("Gents'  12 m²",     785, 435, 130,  90, "toilet"),
        R("Disabled WC  4 m²", 925, 335,  55,  90, "toilet"),
        R("Janitor  4 m²",     925, 435,  55,  90, "service"),
        R("Stairwell (W)",      20, 528, 115, 132, "stair"),
        R("Elevator Core",     145, 528, 115, 132, "elevator"),
        R("Exterior Balcony  27 m²", 270, 528, 210, 132, "balcony"),
      ]
    }))
  ]
};

export const FP_STYLE = {
  lobby:    { fill: "rgba(59,130,246,0.22)",  stroke: "#3b82f6" },
  lab:      { fill: "rgba(16,185,129,0.22)",  stroke: "#10b981" },
  office:   { fill: "rgba(245,158,11,0.22)",  stroke: "#f59e0b" },
  corridor: { fill: "rgba(148,163,184,0.14)", stroke: "#64748b" },
  stair:    { fill: "rgba(124,58,237,0.25)",  stroke: "#7c3aed" },
  elevator: { fill: "rgba(6,182,212,0.25)",   stroke: "#06b6d4" },
  toilet:   { fill: "rgba(236,72,153,0.18)",  stroke: "#ec4899" },
  service:  { fill: "rgba(120,113,108,0.22)", stroke: "#78716c" },
  meeting:  { fill: "rgba(234,179,8,0.22)",   stroke: "#eab308" },
  library:  { fill: "rgba(168,85,247,0.22)",  stroke: "#a855f7" },
  parking:  { fill: "rgba(99,102,241,0.16)",  stroke: "#6366f1" },
  parkslot: { fill: "rgba(99,102,241,0.08)",  stroke: "#4f46e5" },
  ramp:     { fill: "rgba(234,179,8,0.28)",   stroke: "#ca8a04" },
  shaft:    { fill: "rgba(239,68,68,0.25)",   stroke: "#ef4444" },
  balcony:  { fill: "rgba(52,211,153,0.18)",  stroke: "#34d399" },
  bridge:   { fill: "rgba(14,165,233,0.22)",  stroke: "#0ea5e9" },
};
