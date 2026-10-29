#!/usr/bin/env node
// Live backend smoke test. Plain Node >= 20, no dependencies.
//
//   LCMS_API=http://localhost:3001/api LCMS_USER=... LCMS_PASS=... node scripts/live-smoke.mjs
//
// Logs in, GETs one page of every list/dashboard/dropdown endpoint and records, per
// endpoint, the HTTP status plus a *shape* (keys -> typeof). Values are never stored,
// except short string samples (truncated to 40 chars); any key matching
// /token|password|secret/i is replaced by "<redacted>". Output: docs/backend/live-shapes.json.

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const API = (process.env.LCMS_API ?? '').replace(/\/+$/, '');
const USER = process.env.LCMS_USER ?? '';
const PASS = process.env.LCMS_PASS ?? '';

if (!API || !USER || !PASS) {
  console.error('Set LCMS_API, LCMS_USER and LCMS_PASS (e.g. LCMS_API=http://localhost:3001/api).');
  process.exit(2);
}

const SECRET_KEY = /token|password|secret/i;
const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'backend', 'live-shapes.json');

/** Recursive shape: objects -> keys with shapes, arrays -> first element, primitives -> typeof. */
export function shapeOf(value, key = '') {
  if (SECRET_KEY.test(key) && value !== null && value !== undefined) return '<redacted>';
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return { __array: value.length, first: value.length > 0 ? shapeOf(value[0], key) : null };
  }
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value)) out[k] = shapeOf(v, k);
    return out;
  }
  if (typeof value === 'string') return `string:${value.length > 40 ? `${value.slice(0, 40)}...` : value}`;
  return typeof value;
}

let token = null;

async function request(method, path, body) {
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  try {
    const res = await fetch(`${API}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = undefined;
    }
    return { status: res.status, json, text };
  } catch (err) {
    return { status: 0, json: undefined, text: String(err?.message ?? err) };
  }
}

const results = {};

async function probe(label, path) {
  const r = await request('GET', path);
  const entry = { path, status: r.status };
  if (r.json !== undefined) entry.shape = shapeOf(r.json);
  else if (r.status === 0) entry.error = r.text.slice(0, 120);
  else entry.note = `non-JSON body (${r.text.length} chars)`;
  if (r.status === 403) entry.note = 'forbidden for this user (403)';
  results[label] = entry;
  console.log(`${String(r.status).padStart(3)}  ${path}`);
  return r;
}

/** First record id from any of the tolerated list envelopes. */
function firstId(json) {
  const candidates = [json, json?.data, json?.data?.items, json?.data?.data, json?.items];
  for (const c of candidates) {
    if (Array.isArray(c) && c.length > 0 && c[0] && typeof c[0] === 'object') {
      const rec = c[0];
      const id = rec.id ?? rec.internalId ?? rec.uuid;
      if (id !== undefined && id !== null) return String(id);
    }
  }
  return null;
}

async function main() {
  const login = await request('POST', '/auth/login', { username: USER, password: PASS });
  results['POST /auth/login'] = {
    path: '/auth/login',
    status: login.status,
    ...(login.json !== undefined ? { shape: shapeOf(login.json) } : {}),
  };
  console.log(`${String(login.status).padStart(3)}  POST /auth/login`);
  token = login.json?.accessToken ?? login.json?.data?.accessToken ?? null;
  if (!token) {
    console.error('Login failed or returned no accessToken; aborting.');
    await write();
    process.exit(1);
  }

  await probe('GET /auth/me', '/auth/me');

  const lists = [
    ['contracts', '/contracts', 'contracts'],
    ['legal-documents', '/legal-documents', 'legal-documents'],
    ['legal-cases', '/legal-cases', 'legal-cases'],
    ['power-contracts', '/power-contracts', 'power-contracts'],
  ];
  const firstIds = {};
  for (const [name, path] of lists) {
    const r = await probe(`GET ${path}`, `${path}?page=1&limit=2`);
    if (r.status === 200) firstIds[name] = firstId(r.json);
  }
  for (const path of ['/users', '/audit-logs', '/support/tickets']) {
    await probe(`GET ${path}`, `${path}?page=1&limit=2`);
  }

  for (const path of [
    '/contracts/dashboard',
    '/legal-documents/dashboard',
    '/legal-cases/dashboard',
    '/power-contracts/dashboard',
    '/contract-types/dropdown',
    '/departments/dropdown',
    '/power-contracts/project-types',
    '/notifications',
    '/power-notifications',
    '/support/contacts',
  ]) {
    await probe(`GET ${path}`, path);
  }

  for (const [name, id] of Object.entries(firstIds)) {
    if (!id) continue;
    const enc = encodeURIComponent(id);
    await probe(`GET /${name}/:id`, `/${name}/${enc}`);
    await probe(`GET /${name}/:id/attachments`, `/${name}/${enc}/attachments`);
    if (name === 'contracts' || name === 'power-contracts') {
      await probe(`GET /${name}/:id/history`, `/${name}/${enc}/history`);
    }
  }

  await write();
  summarize();
}

async function write() {
  await mkdir(dirname(OUT), { recursive: true });
  const doc = { generatedAt: new Date().toISOString(), api: API, results };
  await writeFile(OUT, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
  console.log(`\nWrote ${OUT}`);
}

function summarize() {
  const entries = Object.values(results);
  const byStatus = {};
  for (const e of entries) byStatus[e.status] = (byStatus[e.status] ?? 0) + 1;
  console.log(`\n${entries.length} requests: ${JSON.stringify(byStatus)}`);
  const forbidden = entries.filter((e) => e.status === 403).map((e) => e.path);
  if (forbidden.length) console.log(`403 (user lacks access): ${forbidden.join(', ')}`);
  const bad = entries.filter((e) => e.status !== 200 && e.status !== 201 && e.status !== 403);
  if (bad.length) console.log(`Unexpected: ${bad.map((e) => `${e.status} ${e.path}`).join(', ')}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
