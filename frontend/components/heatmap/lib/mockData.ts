// ─── Mock data for AASTU campus (Addis Ababa Science and Technology University)
// Coordinates centred around 8.8848°N, 38.8080°E
// Spread over ~400m × 500m campus footprint

import type { Node, Session } from './types';

// ── Campus nodes ──────────────────────────────────────────────────────────────
export const CAMPUS_NODES: Node[] = [
  { id: 'n01', name: 'Main Gate Entrance',        shortName: 'Main Gate',    latitude: 8.8830, longitude: 38.8072, type: 'entrance',   status: 'active',    capacity: 500, building: 'Gate' },
  { id: 'n02', name: 'Administration Building',   shortName: 'Admin',        latitude: 8.8850, longitude: 38.8063, type: 'admin',      status: 'active',    capacity: 120, building: 'Admin' },
  { id: 'n03', name: 'Central Library',           shortName: 'Library',      latitude: 8.8856, longitude: 38.8080, type: 'library',    status: 'active',    capacity: 300, building: 'Library' },
  { id: 'n04', name: 'Engineering Block A',       shortName: 'Eng-A',        latitude: 8.8862, longitude: 38.8063, type: 'classroom',  status: 'congested', capacity: 200, building: 'Engineering', floor: 1 },
  { id: 'n05', name: 'Engineering Block B',       shortName: 'Eng-B',        latitude: 8.8866, longitude: 38.8078, type: 'classroom',  status: 'congested', capacity: 200, building: 'Engineering', floor: 2 },
  { id: 'n06', name: 'Engineering Block C',       shortName: 'Eng-C',        latitude: 8.8863, longitude: 38.8092, type: 'classroom',  status: 'active',    capacity: 180, building: 'Engineering', floor: 3 },
  { id: 'n07', name: 'Science Block',             shortName: 'Science',      latitude: 8.8854, longitude: 38.8094, type: 'classroom',  status: 'active',    capacity: 160, building: 'Science' },
  { id: 'n08', name: 'IT & Computer Building',    shortName: 'IT Bldg',      latitude: 8.8848, longitude: 38.8079, type: 'lab',        status: 'congested', capacity: 140, building: 'IT' },
  { id: 'n09', name: 'Main Cafeteria',            shortName: 'Cafeteria',    latitude: 8.8843, longitude: 38.8083, type: 'cafeteria',  status: 'congested', capacity: 400, building: 'Cafeteria' },
  { id: 'n10', name: 'Student Services Center',   shortName: 'Student Ctr',  latitude: 8.8847, longitude: 38.8073, type: 'admin',      status: 'active',    capacity: 80,  building: 'Student' },
  { id: 'n11', name: 'Research Labs Complex',     shortName: 'Research',     latitude: 8.8861, longitude: 38.8097, type: 'lab',        status: 'active',    capacity: 60,  building: 'Research' },
  { id: 'n12', name: 'Lecture Hall Block 1',      shortName: 'LH-1',         latitude: 8.8852, longitude: 38.8070, type: 'classroom',  status: 'active',    capacity: 250, building: 'LectureHall' },
  { id: 'n13', name: 'Lecture Hall Block 2',      shortName: 'LH-2',         latitude: 8.8858, longitude: 38.8086, type: 'classroom',  status: 'active',    capacity: 250, building: 'LectureHall' },
  { id: 'n14', name: 'Male Dormitory',            shortName: 'Dorm-M',       latitude: 8.8872, longitude: 38.8069, type: 'dormitory',  status: 'active',    capacity: 300, building: 'Dormitory' },
  { id: 'n15', name: 'Female Dormitory',          shortName: 'Dorm-F',       latitude: 8.8870, longitude: 38.8091, type: 'dormitory',  status: 'active',    capacity: 300, building: 'Dormitory' },
  { id: 'n16', name: 'Sports Complex',            shortName: 'Sports',       latitude: 8.8837, longitude: 38.8063, type: 'sports',     status: 'active',    capacity: 500, building: 'Sports' },
  { id: 'n17', name: 'Health Center',             shortName: 'Health',       latitude: 8.8842, longitude: 38.8092, type: 'admin',      status: 'active',    capacity: 50,  building: 'Health' },
  { id: 'n18', name: 'Parking Area A',            shortName: 'Parking-A',    latitude: 8.8833, longitude: 38.8079, type: 'parking',    status: 'active',    capacity: 200, building: 'Parking' },
  { id: 'n19', name: 'Parking Area B',            shortName: 'Parking-B',    latitude: 8.8867, longitude: 38.8100, type: 'parking',    status: 'active',    capacity: 150, building: 'Parking' },
  { id: 'n20', name: 'ATM & Mini Bank',           shortName: 'ATM',          latitude: 8.8846, longitude: 38.8086, type: 'admin',      status: 'active',    capacity: 20,  building: 'Services' },
  { id: 'n21', name: 'Mini Mart',                 shortName: 'Mart',         latitude: 8.8841, longitude: 38.8075, type: 'cafeteria',  status: 'active',    capacity: 30,  building: 'Services' },
  { id: 'n22', name: 'Chemical Engineering Lab',  shortName: 'Chem Lab',     latitude: 8.8859, longitude: 38.8099, type: 'lab',        status: 'active',    capacity: 40,  building: 'Labs', floor: 1 },
  { id: 'n23', name: 'Physics Lab',               shortName: 'Phys Lab',     latitude: 8.8860, longitude: 38.8068, type: 'lab',        status: 'active',    capacity: 40,  building: 'Labs', floor: 1 },
  { id: 'n24', name: 'Biology Lab',               shortName: 'Bio Lab',      latitude: 8.8856, longitude: 38.8096, type: 'lab',        status: 'maintenance', capacity: 35, building: 'Labs', floor: 2 },
  { id: 'n25', name: 'Computer Science Lab',      shortName: 'CS Lab',       latitude: 8.8850, longitude: 38.8071, type: 'lab',        status: 'congested', capacity: 60,  building: 'IT', floor: 1 },
  { id: 'n26', name: 'Main Auditorium',           shortName: 'Auditorium',   latitude: 8.8848, longitude: 38.8090, type: 'auditorium', status: 'active',    capacity: 600, building: 'Auditorium' },
  { id: 'n27', name: 'East Side Gate',            shortName: 'East Gate',    latitude: 8.8852, longitude: 38.8107, type: 'entrance',   status: 'active',    capacity: 200, building: 'Gate' },
  { id: 'n28', name: 'North Gate',                shortName: 'North Gate',   latitude: 8.8877, longitude: 38.8081, type: 'entrance',   status: 'active',    capacity: 200, building: 'Gate' },
  { id: 'n29', name: 'Faculty Offices',           shortName: 'Faculty',      latitude: 8.8853, longitude: 38.8060, type: 'admin',      status: 'active',    capacity: 80,  building: 'Admin' },
  { id: 'n30', name: 'Graduate Studies Center',   shortName: 'Grad Center',  latitude: 8.8844, longitude: 38.8097, type: 'admin',      status: 'active',    capacity: 60,  building: 'Admin' },
];

// ── Session generator ─────────────────────────────────────────────────────────

// Traffic probability per node by hour (0-23). High values = more likely to appear in session.
const NODE_HOURLY_WEIGHT: Record<string, number[]> = {
  // Entries   [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]
  n01: [0.1, 0.1, 0.0, 0.0, 0.1, 0.3, 0.7, 0.9, 1.0, 0.8, 0.6, 0.7, 0.9, 0.8, 0.7, 0.6, 0.7, 0.8, 0.7, 0.5, 0.4, 0.3, 0.2, 0.1],
  n04: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.5, 0.9, 1.0, 0.9, 0.8, 0.4, 0.8, 0.9, 0.8, 0.5, 0.3, 0.2, 0.1, 0.0, 0.0, 0.0, 0.0],
  n05: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.6, 1.0, 1.0, 0.8, 0.7, 0.4, 0.7, 0.8, 0.9, 0.6, 0.3, 0.1, 0.0, 0.0, 0.0, 0.0, 0.0],
  n09: [0.1, 0.0, 0.0, 0.0, 0.0, 0.0, 0.2, 0.4, 0.6, 0.5, 0.4, 0.8, 1.0, 0.9, 0.4, 0.3, 0.3, 0.4, 0.7, 0.5, 0.3, 0.2, 0.1, 0.0],
  n03: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.3, 0.6, 0.7, 0.8, 0.8, 0.5, 0.7, 0.9, 1.0, 0.9, 0.7, 0.6, 0.5, 0.4, 0.3, 0.1, 0.0],
  n08: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.4, 0.8, 0.9, 1.0, 0.8, 0.4, 0.7, 0.9, 0.8, 0.7, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, 0.0],
  n25: [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.3, 0.7, 0.8, 0.9, 0.8, 0.3, 0.6, 0.8, 0.9, 0.8, 0.6, 0.5, 0.3, 0.2, 0.1, 0.0, 0.0],
};

const DEFAULT_HOURLY = [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.1, 0.3, 0.6, 0.7, 0.8, 0.7, 0.5, 0.6, 0.7, 0.7, 0.5, 0.4, 0.3, 0.2, 0.1, 0.0, 0.0, 0.0];

function getNodeWeight(nodeId: string, hour: number): number {
  return (NODE_HOURLY_WEIGHT[nodeId] || DEFAULT_HOURLY)[hour] || 0;
}

// Common paths students take between nodes
const COMMON_PATHS: string[][] = [
  ['n01', 'n18', 'n10', 'n09'],
  ['n01', 'n12', 'n04'],
  ['n01', 'n12', 'n05'],
  ['n01', 'n08', 'n25'],
  ['n01', 'n10', 'n03'],
  ['n14', 'n01', 'n04', 'n05'],
  ['n15', 'n01', 'n06', 'n07'],
  ['n28', 'n05', 'n13', 'n09'],
  ['n27', 'n06', 'n11', 'n22'],
  ['n12', 'n09', 'n03'],
  ['n04', 'n09', 'n03'],
  ['n05', 'n13', 'n09'],
  ['n08', 'n20', 'n09'],
  ['n02', 'n29', 'n12'],
  ['n03', 'n13', 'n26'],
  ['n04', 'n23', 'n12'],
  ['n07', 'n22', 'n11'],
  ['n01', 'n16', 'n18'],
  ['n09', 'n21', 'n17'],
  ['n14', 'n09', 'n08'],
];

let sessionCounter = 1;
let userCounter = 1;

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomGaussian(mean: number, std: number): number {
  const u = 1 - Math.random();
  const v = Math.random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return mean + z * std;
}

function generateSessionForHour(hour: number, date: Date): Session {
  const id = `s${String(sessionCounter++).padStart(5, '0')}`;
  const userId = `u${String(Math.ceil(Math.random() * 800)).padStart(4, '0')}`;

  // Pick a path weighted by the hour
  const path = randomChoice(COMMON_PATHS);

  // Possibly extend path with adjacent nodes
  const visitedNodes = [...path];
  if (Math.random() > 0.6) {
    const extra = randomChoice(CAMPUS_NODES);
    visitedNodes.push(extra.id);
  }

  const startMinute = Math.floor(Math.random() * 60);
  const startedAt = new Date(date);
  startedAt.setHours(hour, startMinute, Math.floor(Math.random() * 60), 0);

  const durationSec = Math.max(120, Math.floor(randomGaussian(1200, 600)));
  const endedAt = new Date(startedAt.getTime() + durationSec * 1000);

  const routeTaken: [string, string][] = [];
  for (let i = 0; i < visitedNodes.length - 1; i++) {
    routeTaken.push([visitedNodes[i], visitedNodes[i + 1]]);
  }

  return {
    id,
    userId,
    startedAt,
    endedAt,
    visitedNodes,
    routeTaken,
    duration: durationSec,
    isActive: endedAt > new Date(),
  };
}

// Generate sessions for the last 7 days
export function generateSessions(days = 7): Session[] {
  const sessions: Session[] = [];
  const now = new Date();

  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    date.setHours(0, 0, 0, 0);

    // Weekday vs weekend multiplier
    const dow = date.getDay();
    const dayMultiplier = (dow === 0 || dow === 6) ? 0.3 : 1.0;

    for (let h = 0; h < 24; h++) {
      // Base session count varies by hour
      const hourWeight = DEFAULT_HOURLY[h];
      const base = Math.round(hourWeight * 40 * dayMultiplier);
      const count = Math.max(0, Math.floor(randomGaussian(base, base * 0.2)));

      for (let i = 0; i < count; i++) {
        sessions.push(generateSessionForHour(h, date));
      }
    }
  }

  return sessions;
}

// Generate a batch of "live" sessions happening right now
export function generateLiveSessions(count = 5): Session[] {
  const now = new Date();
  const hour = now.getHours();
  return Array.from({ length: count }, () => {
    const s = generateSessionForHour(hour, now);
    s.endedAt = null;
    s.isActive = true;
    return s;
  });
}

// Pre-generated base dataset (deterministic-ish via seeded random-ish)
export const BASE_SESSIONS: Session[] = generateSessions(7);
