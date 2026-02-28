#!/usr/bin/env node
/**
 * cc-shift
 * Visualizes when your AI worked throughout the day.
 * Like a shift schedule, but for your AI.
 */
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join, resolve } from 'path';

const args = process.argv.slice(2);
const flags = {
  date: args.find(a => a.startsWith('--date='))?.slice(7),
  dir: args.find(a => a.startsWith('--dir='))?.slice(6) || '~/ops/proof-log',
  cols: parseInt(args.find(a => a.startsWith('--cols='))?.slice(7) ?? '48'),
  help: args.includes('--help') || args.includes('-h'),
};

if (flags.help) {
  console.log(`cc-shift — When did your AI work today?

Usage:
  npx cc-shift                  Yesterday's shift chart
  npx cc-shift --date=2026-02-20
  npx cc-shift --cols=72        Wider chart (default: 48)

Options:
  --date=YYYY-MM-DD   Specific date (default: yesterday)
  --dir=PATH          Proof-log directory (default: ~/ops/proof-log)
  --cols=N            Width of timeline (default: 48)
  --help              Show this help`);
  process.exit(0);
}

// ── Date helpers ──────────────────────────────────────────────

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function dayName(dateStr) {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[new Date(dateStr + 'T12:00:00Z').getDay()];
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${months[parseInt(m)-1]} ${parseInt(d)}, ${y}`;
}

function parseTime(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m; // minutes since midnight
}

// ── Proof-log parser ──────────────────────────────────────────

const SESSION_HEADER = /^### (\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})-(\d{2}:\d{2}) JST/;
const WHERE_LINE     = /^- どこで: (.+)$/;

function parseProofLog(content) {
  const sessions = [];
  let current = null;

  for (const raw of content.split('\n')) {
    const line = raw.trim();
    const headerMatch = SESSION_HEADER.exec(line);
    if (headerMatch) {
      if (current && current.project) sessions.push(current);
      current = {
        startMin: parseTime(headerMatch[2]),
        endMin:   parseTime(headerMatch[3]),
        project:  null,
      };
      // Handle midnight crossover (end < start means it crossed midnight)
      if (current.endMin < current.startMin) current.endMin += 24 * 60;
      // Ensure minimum 1 minute
      if (current.endMin === current.startMin) current.endMin = current.startMin + 1;
      continue;
    }
    if (!current) continue;
    const whereMatch = WHERE_LINE.exec(line);
    if (whereMatch) { current.project = whereMatch[1].trim(); continue; }
  }
  if (current && current.project) sessions.push(current);
  return sessions;
}

// ── Build timeline ────────────────────────────────────────────

function buildTimeline(sessions, cols) {
  const TOTAL_MINS = 24 * 60;
  // Map each column to a minute range
  const minsPerCol = TOTAL_MINS / cols;

  // Collect all projects
  const projectSet = new Set();
  for (const s of sessions) projectSet.add(s.project);
  const projects = [...projectSet].sort();

  if (projects.length === 0) return null;

  // For each project, build a row of cols characters
  const rows = {};
  for (const p of projects) {
    rows[p] = new Array(cols).fill('░');
  }

  // Mark active columns for each session
  for (const s of sessions) {
    const p = s.project;
    const startCol = Math.floor(s.startMin / minsPerCol);
    const endCol   = Math.min(cols, Math.ceil(s.endMin / minsPerCol));
    for (let c = startCol; c < endCol; c++) {
      rows[p][c] = '▓';
    }
  }

  // Merge: also build an "ALL" row
  const allRow = new Array(cols).fill('░');
  for (const p of projects) {
    for (let c = 0; c < cols; c++) {
      if (rows[p][c] === '▓') allRow[c] = '▓';
    }
  }

  return { rows, allRow, projects };
}

// ── Format hour labels ────────────────────────────────────────

function hourLabels(cols) {
  // Place labels every 6h: 00, 06, 12, 18, (24)
  const TOTAL_MINS = 24 * 60;
  const minsPerCol = TOTAL_MINS / cols;
  const labels = new Array(cols + 14).fill(' ');

  [0, 6, 12, 18].forEach(h => {
    const col = Math.round((h * 60) / minsPerCol);
    const label = h === 0 ? '00:00' : `${String(h).padStart(2,'0')}:00`;
    for (let i = 0; i < label.length; i++) {
      if (col + i < labels.length) labels[col + i] = label[i];
    }
  });
  return labels.join('').slice(0, cols + 2);
}

// ── Main ──────────────────────────────────────────────────────

const targetDate = flags.date || getYesterday();
const logDir = resolve(flags.dir.replace('~', homedir()));
const logFile = join(logDir, `${targetDate}.md`);

if (!existsSync(logFile)) {
  console.log(`AI Shift — ${formatDate(targetDate)} (${dayName(targetDate)})`);
  console.log('');
  console.log('  👻 Ghost Day — no sessions logged.');
  process.exit(0);
}

const content = readFileSync(logFile, 'utf8');
const sessions = parseProofLog(content);
const COLS = flags.cols;
const result = buildTimeline(sessions, COLS);

if (!result) {
  console.log(`AI Shift — ${formatDate(targetDate)}: no project data found.`);
  process.exit(0);
}

const { rows, allRow, projects } = result;

// Max project name length
const maxLen = Math.min(20, Math.max(...projects.map(p => p.length)));

console.log(`AI Shift — ${formatDate(targetDate)} (${dayName(targetDate)})`);
console.log('');

// Header with hour labels
const labelPad = ' '.repeat(maxLen + 3);
console.log(`${labelPad}${hourLabels(COLS)}`);

// Project rows
for (const p of projects) {
  const name = p.length > maxLen ? p.slice(0, maxLen - 1) + '…' : p;
  const padded = name.padEnd(maxLen, ' ');
  console.log(`  ${padded}  ${rows[p].join('')}`);
}

// Separator + ALL row
if (projects.length > 1) {
  console.log(`  ${'─'.repeat(maxLen)}  ${'─'.repeat(COLS)}`);
  console.log(`  ${'ALL'.padEnd(maxLen, ' ')}  ${allRow.join('')}`);
}

console.log('');

// Count active minutes
const totalActiveMin = allRow.filter(c => c === '▓').length * (24 * 60 / COLS);
const h = Math.floor(totalActiveMin / 60);
const m = Math.round(totalActiveMin % 60);
const activeStr = h > 0 ? `${h}h ${m}m` : `${m}m`;

// Find first and last active
const firstActive = allRow.indexOf('▓');
const lastActive  = allRow.lastIndexOf('▓');
const firstH = Math.floor(firstActive * (24 * 60 / COLS) / 60);
const lastH  = Math.floor(lastActive  * (24 * 60 / COLS) / 60);
const firstM = Math.round((firstActive * (24 * 60 / COLS)) % 60);
const lastM  = Math.round((lastActive  * (24 * 60 / COLS)) % 60);
const timeRange = `${String(firstH).padStart(2,'0')}:${String(firstM).padStart(2,'0')} – ${String(lastH).padStart(2,'0')}:${String(lastM).padStart(2,'0')} JST`;

console.log(`  Active: ${activeStr}  ·  ${timeRange}  ·  ${sessions.length} sessions`);
