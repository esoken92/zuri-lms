#!/usr/bin/env node
/**
 * Screenshot capture — needs a running dev server and puppeteer-core
 * (dev-only, not a project dependency; run from a dir that has it, e.g.
 * `node scripts/screenshot.mjs` with puppeteer-core resolvable).
 *
 * Usage: node scripts/screenshot.mjs [baseUrl] [prefix]
 */
import puppeteer from 'puppeteer-core'

const base = process.argv[2] ?? 'http://localhost:3000'
const prefix = process.argv[3] ?? ''
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'

const SHOTS = [
  ['/', 'landing'],
  ['/login', 'login'],
  ['/register', 'register'],
]

const browser = await puppeteer.launch({ executablePath: EDGE, headless: 'new' })
const page = await browser.newPage()
await page.setViewport({ width: 1440, height: 900 })
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

for (const [path, name] of SHOTS) {
  await page.goto(base + path, { waitUntil: 'load', timeout: 20000 })
  await new Promise((r) => setTimeout(r, 2500))
  await page.screenshot({ path: `public/screenshots/${prefix}${name}.png` })
  console.log(`${name} captured`)
}
console.log('console errors: ' + (errors.length ? errors.join(' | ') : 'none'))
await browser.close()
