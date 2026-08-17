import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.join(__dirname, '..', 'public', 'images', 'products')

export const METALS = {
  gold: { name: 'Gold', light: '#F0DFB4', mid: '#C9A55C', dark: '#9A7740', edge: '#7C5E2E' },
  rose: { name: 'Rose Gold', light: '#F3D3C0', mid: '#D9A88B', dark: '#B57E63', edge: '#8F5D46' },
  platinum: { name: 'Platinum', light: '#F3F4F6', mid: '#C7CCD4', dark: '#9AA1AC', edge: '#6E757F' },
}

export const GEMS = {
  diamond: { name: 'Diamond', light: '#FDFEFF', mid: '#D6EBFA', dark: '#9CC4E4' },
  emerald: { name: 'Emerald', light: '#BFE8D8', mid: '#2E8B6D', dark: '#1C5C49' },
  sapphire: { name: 'Sapphire', light: '#C9DCF8', mid: '#2E5AA8', dark: '#1B3A70' },
  ruby: { name: 'Ruby', light: '#F5C4C4', mid: '#A33444', dark: '#6E1F2B' },
  pearl: { name: 'Pearl', light: '#FFF9F0', mid: '#F0E4D2', dark: '#CBBBA4' },
  onyx: { name: 'Onyx', light: '#5A5A5A', mid: '#2A2A2A', dark: '#141414' },
}

function esc(s) {
  return String(s)
}

function frame(width = 800, height = 800) {
  return `
  <defs>
    <radialGradient id="bg" cx="50%" cy="42%" r="75%">
      <stop offset="0%" stop-color="#FBF7EF"/>
      <stop offset="55%" stop-color="#F5EDDE"/>
      <stop offset="100%" stop-color="#EADFC9"/>
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="50%" r="70%">
      <stop offset="60%" stop-color="#000000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#6B5A3E" stop-opacity="0.14"/>
    </radialGradient>
    <filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="14" result="blur"/>
      <feOffset dx="0" dy="18"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.22"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="gemGlow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="grain" width="120" height="120" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="18" r="0.6" fill="#000000" opacity="0.02"/>
      <circle cx="70" cy="52" r="0.5" fill="#000000" opacity="0.02"/>
      <circle cx="40" cy="96" r="0.7" fill="#000000" opacity="0.015"/>
      <circle cx="104" cy="30" r="0.5" fill="#ffffff" opacity="0.5"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg)"/>
  <rect width="${width}" height="${height}" fill="url(#grain)"/>
  <rect width="${width}" height="${height}" fill="url(#vignette)"/>
  <rect x="14" y="14" width="${width - 28}" height="${height - 28}" fill="none" stroke="#B99B63" stroke-opacity="0.5" stroke-width="1.5"/>
  <rect x="22" y="22" width="${width - 44}" height="${height - 44}" fill="none" stroke="#C6A664" stroke-opacity="0.28" stroke-width="1"/>`
}

function metalGrad(id, metal) {
  return `<linearGradient id="${id}" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${metal.light}"/>
    <stop offset="45%" stop-color="${metal.mid}"/>
    <stop offset="100%" stop-color="${metal.dark}"/>
  </linearGradient>`
}

function gemShape(cx, cy, r, gem, kind = 'round') {
  const glow = gem.mid
  if (kind === 'round') {
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${gem.mid}" filter="url(#gemGlow)"/>
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#gem-${gem.name})"/>
      <circle cx="${cx - r * 0.32}" cy="${cy - r * 0.34}" r="${r * 0.42}" fill="#ffffff" opacity="0.85"/>
      <circle cx="${cx + r * 0.28}" cy="${cy + r * 0.3}" r="${r * 0.18}" fill="${glow}" opacity="0.8"/>`
  }
  if (kind === 'oval') {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${r * 1.5}" ry="${r}" fill="${gem.mid}" filter="url(#gemGlow)"/>
      <ellipse cx="${cx}" cy="${cy}" rx="${r * 1.5}" ry="${r}" fill="url(#gem-${gem.name})"/>
      <ellipse cx="${cx - r * 0.5}" cy="${cy - r * 0.4}" rx="${r * 0.6}" ry="${r * 0.42}" fill="#ffffff" opacity="0.8"/>
      <circle cx="${cx + r * 0.5}" cy="${cy + r * 0.45}" r="${r * 0.16}" fill="${glow}" opacity="0.7"/>`
  }
  if (kind === 'marquise') {
    return `<path d="M ${cx} ${cy - r} C ${cx + r * 1.6} ${cy - r * 0.5}, ${cx + r * 1.6} ${cy + r * 0.5}, ${cx} ${cy + r} C ${cx - r * 1.6} ${cy + r * 0.5}, ${cx - r * 1.6} ${cy - r * 0.5}, ${cx} ${cy - r} Z" fill="${gem.mid}" filter="url(#gemGlow)"/>
      <path d="M ${cx} ${cy - r} C ${cx + r * 1.6} ${cy - r * 0.5}, ${cx + r * 1.6} ${cy + r * 0.5}, ${cx} ${cy + r} C ${cx - r * 1.6} ${cy + r * 0.5}, ${cx - r * 1.6} ${cy - r * 0.5}, ${cx} ${cy - r} Z" fill="url(#gem-${gem.name})"/>
      <path d="M ${cx - r * 0.4} ${cy - r * 0.45} L ${cx + r * 0.1} ${cy} L ${cx - r * 0.4} ${cy + r * 0.45} Z" fill="#ffffff" opacity="0.75"/>`
  }
  if (kind === 'emerald-cut') {
    return `<rect x="${cx - r}" y="${cy - r * 1.15}" width="${r * 2}" height="${r * 2.3}" rx="${r * 0.28}" fill="${gem.mid}" filter="url(#gemGlow)"/>
      <rect x="${cx - r}" y="${cy - r * 1.15}" width="${r * 2}" height="${r * 2.3}" rx="${r * 0.28}" fill="url(#gem-${gem.name})"/>
      <rect x="${cx - r * 0.34}" y="${cy - r * 0.8}" width="${r * 0.68}" height="${r * 0.42}" fill="#ffffff" opacity="0.8" rx="2"/>
      <rect x="${cx - r * 0.34}" y="${cy + r * 0.38}" width="${r * 0.68}" height="${r * 0.42}" fill="#ffffff" opacity="0.55" rx="2"/>`
  }
  return ''
}

function chain(cx, top, bottom, metal, sag = 120) {
  const midY = (top + bottom) / 2 + sag
  const path = `M ${cx} ${top} C ${cx + 130} ${midY * 0.6 + top * 0.4}, ${cx + 130} ${bottom - 40}, ${cx} ${bottom}`
  return `<path d="${path}" fill="none" stroke="${metal.mid}" stroke-width="2.5" stroke-dasharray="0.1 9" stroke-linecap="round"/>
    <path d="${path}" fill="none" stroke="${metal.light}" stroke-width="1.2" stroke-dasharray="0.1 9" stroke-linecap="round"/>`
}

function draw(kind, metal, gem) {
  const m = METALS[metal]
  const g = GEMS[gem]
  let body = ''
  const gd = metalGrad(`metal-${metal}`, m)
  const gG = gemShape.length > 0 ? `<radialGradient id="gem-${g.name}" cx="35%" cy="30%" r="90%">
    <stop offset="0%" stop-color="${g.light}"/>
    <stop offset="55%" stop-color="${g.mid}"/>
    <stop offset="100%" stop-color="${g.dark}"/>
  </radialGradient>` : ''

  if (kind === 'ring') {
    body = `
      ${chain(400, 150, 620, m, 130)}
      <g filter="url(#soft)" transform="rotate(-8 400 470)">
        <ellipse cx="400" cy="470" rx="150" ry="52" fill="none" stroke="url(#metal-${metal})" stroke-width="22"/>
        <ellipse cx="400" cy="470" rx="150" ry="52" fill="none" stroke="${m.light}" stroke-width="6" stroke-dasharray="2 26" opacity="0.9"/>
        <ellipse cx="400" cy="470" rx="150" ry="52" fill="none" stroke="${m.dark}" stroke-width="2" opacity="0.7"/>
        <path d="M 400 410 L 400 322" stroke="url(#metal-${metal})" stroke-width="26" stroke-linecap="round"/>
        <path d="M 400 398 L 400 330" stroke="${m.light}" stroke-width="6" opacity="0.85"/>
        ${gemShape(400, 316, 46, g, 'round')}
        <circle cx="400" cy="316" r="52" fill="none" stroke="${m.dark}" stroke-width="3" opacity="0.6"/>
      </g>`
  } else if (kind === 'necklace') {
    body = `
      <g filter="url(#soft)">
        ${chain(400, 130, 560, m, 150)}
        <path d="M 400 552 C 340 600, 360 640, 400 640 C 440 640, 460 600, 400 552 Z" fill="url(#metal-${metal})"/>
        <path d="M 400 552 C 340 600, 360 640, 400 640 C 440 640, 460 600, 400 552 Z" fill="none" stroke="${m.dark}" stroke-width="2" opacity="0.5"/>
        ${gemShape(400, 600, 40, g, 'oval')}
        <circle cx="400" cy="600" r="48" fill="none" stroke="${m.light}" stroke-width="3" opacity="0.9"/>
        <circle cx="400" cy="600" r="52" fill="none" stroke="${m.dark}" stroke-width="1.5" opacity="0.5"/>
      </g>`
  } else if (kind === 'earrings') {
    body = `
      <g filter="url(#soft)">
        <circle cx="352" cy="180" r="7" fill="${m.mid}"/>
        <circle cx="448" cy="180" r="7" fill="${m.mid}"/>
        <line x1="352" y1="180" x2="352" y2="240" stroke="${m.mid}" stroke-width="3"/>
        <line x1="448" y1="180" x2="448" y2="240" stroke="${m.mid}" stroke-width="3"/>
        <path d="M 352 240 L 352 330 C 352 380, 300 380, 300 330 L 300 250 C 300 200, 352 200, 352 240 Z" fill="url(#metal-${metal})"/>
        <path d="M 448 240 L 448 330 C 448 380, 500 380, 500 330 L 500 250 C 500 200, 448 200, 448 240 Z" fill="url(#metal-${metal})"/>
        ${gemShape(352, 300, 34, g, 'teardrop').replace(/cx="352"/g, 'cx="320"').replace(/cy="300"/g, 'cy="300"')}
        ${gemShape(448, 300, 34, g, 'teardrop').replace(/cx="448"/g, 'cx="480"').replace(/cy="300"/g, 'cy="300"')}
        <circle cx="352" cy="270" r="6" fill="${m.light}" opacity="0.8"/>
        <circle cx="448" cy="270" r="6" fill="${m.light}" opacity="0.8"/>
      </g>`
  } else if (kind === 'bracelet') {
    body = `
      <g filter="url(#soft)">
        <circle cx="400" cy="400" r="180" fill="none" stroke="url(#metal-${metal})" stroke-width="26"/>
        <circle cx="400" cy="400" r="180" fill="none" stroke="${m.light}" stroke-width="5" stroke-dasharray="3 22" opacity="0.9"/>
        <circle cx="400" cy="400" r="193" fill="none" stroke="${m.dark}" stroke-width="1.5" opacity="0.5"/>
        <circle cx="400" cy="400" r="167" fill="none" stroke="${m.dark}" stroke-width="1.5" opacity="0.5"/>
        ${gemShape(400, 220, 30, g, 'round')}
        ${gemShape(580, 400, 26, g, 'round')}
        ${gemShape(400, 580, 26, g, 'round')}
        ${gemShape(220, 400, 26, g, 'round')}
      </g>`
  } else if (kind === 'pendant') {
    body = `
      <g filter="url(#soft)">
        ${chain(400, 140, 380, m, 100)}
        <circle cx="400" cy="470" r="16" fill="none" stroke="${m.mid}" stroke-width="5"/>
        <ellipse cx="400" cy="560" rx="92" ry="128" fill="url(#metal-${metal})"/>
        <ellipse cx="400" cy="560" rx="92" ry="128" fill="none" stroke="${m.dark}" stroke-width="2.5" opacity="0.55"/>
        ${gemShape(400, 560, 52, g, 'marquise')}
        <path d="M 352 548 L 448 548 L 400 452 Z" fill="${m.light}" opacity="0.7"/>
      </g>`
  } else if (kind === 'cufflinks') {
    body = `
      <g filter="url(#soft)">
        <circle cx="330" cy="400" r="90" fill="url(#metal-${metal})"/>
        <circle cx="470" cy="400" r="90" fill="url(#metal-${metal})"/>
        <circle cx="330" cy="400" r="70" fill="${m.dark}" opacity="0.18"/>
        <circle cx="470" cy="400" r="70" fill="${m.dark}" opacity="0.18"/>
        ${gemShape(330, 400, 42, g, 'emerald-cut')}
        ${gemShape(470, 400, 42, g, 'emerald-cut')}
        <path d="M 300 400 L 500 400" stroke="${m.dark}" stroke-width="2" opacity="0.6"/>
      </g>`
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">${frame()}${gd}${gG}${body}</svg>`
}

export function generateImage(kind, metal, gem, label = '') {
  return draw(kind, metal, gem)
}

export function generateCategoryImage(kind, metal, gem, label) {
  const m = METALS[metal]
  const base = draw(kind, metal, gem)
  const labelSvg = label
    ? `<text x="400" y="710" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="44" letter-spacing="10" fill="#4A3A22" opacity="0.9">${esc(label.toUpperCase())}</text>`
    : ''
  return base.replace('</svg>', `${labelSvg}\n</svg>`)
}

export function ensureOutputDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true })
}

export function writeImage(filename, svg) {
  ensureOutputDir()
  const file = path.join(OUT_DIR, filename)
  fs.writeFileSync(file, svg)
  return `/api/images/products/${filename}`
}
