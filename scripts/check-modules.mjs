#!/usr/bin/env node
/**
 * Ловит битые named-import'ы до того, как Vite отдаст чёрный экран в dev.
 * (tsc тоже ловит — этот скрипт дублирует проверку без полного typecheck.)
 */
import fs from 'node:fs'
import path from 'node:path'

const root = 'src'
const files = []

function walk(d) {
  for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, ent.name)
    if (ent.isDirectory()) walk(p)
    else if (/\.ts$/.test(ent.name) && !ent.name.endsWith('.d.ts')) files.push(p)
  }
}
walk(root)

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('.')) return null
  const base = path.normalize(path.join(path.dirname(fromFile), spec))
  for (const c of [base + '.ts', path.join(base, 'index.ts'), base]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c
  }
  return null
}

const exportMap = new Map()
const reExport =
  /export\s+(?:async\s+)?(?:function|const|let|var|class|type|interface|enum)\s+([A-Za-z0-9_]+)/g
const reExportList = /export\s*\{([^}]+)\}/g
const reExportFrom = /export\s*\{([^}]+)\}\s*from\s+['"]([^'"]+)['"]/g

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  const names = new Set()
  let m
  const r1 = new RegExp(reExport.source, 'g')
  while ((m = r1.exec(src))) names.add(m[1])
  const r2 = new RegExp(reExportList.source, 'g')
  while ((m = r2.exec(src))) {
    for (const part of m[1].split(',')) {
      const bit = part.trim()
      if (!bit) continue
      const as = bit.split(/\s+as\s+/)
      names.add((as[1] || as[0]).trim())
    }
  }
  if (/export\s+default\s+/.test(src)) names.add('default')
  exportMap.set(file, names)
}

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  let m
  const rF = new RegExp(reExportFrom.source, 'g')
  while ((m = rF.exec(src))) {
    const names = exportMap.get(file)
    for (const part of m[1].split(',')) {
      const bit = part.trim()
      if (!bit) continue
      const as = bit.split(/\s+as\s+/)
      names.add((as[1] || as[0]).trim())
    }
  }
}

const importRe = /import\s+(type\s+)?\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g
const problems = []

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8')
  let m
  const re = new RegExp(importRe.source, 'g')
  while ((m = re.exec(src))) {
    const spec = m[3]
    const target = resolveImport(file, spec)
    if (!target) {
      if (spec.startsWith('.')) {
        problems.push(`${file}: missing module ${spec}`)
      }
      continue
    }
    const exported = exportMap.get(target) || new Set()
    for (const part of m[2].split(',')) {
      let name = part.trim()
      if (!name) continue
      const as = name.split(/\s+as\s+/)
      name = as[0].trim()
      if (name.startsWith('type ')) name = name.slice(5).trim()
      if (!exported.has(name)) {
        problems.push(`${file}: '${name}' not exported by ${spec}`)
      }
    }
  }
}

if (problems.length) {
  console.error('check-modules: failed\n' + problems.join('\n'))
  process.exit(1)
}
console.log(`check-modules: ok (${files.length} files)`)
