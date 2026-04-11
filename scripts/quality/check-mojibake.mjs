import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const baselinePath = path.join(root, 'quality-baseline.json')
const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : { mojibakeAllow: [] }

function walk(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'dev-dist') continue
      results.push(...walk(fullPath))
      continue
    }
    results.push(fullPath)
  }
  return results
}

const files = [
  path.join(root, 'README.md'),
  path.join(root, 'RULES.md'),
  ...walk(path.join(root, 'docs')),
  ...walk(path.join(root, 'src')).filter((file) => /\.(ts|tsx|md)$/.test(file))
].filter((file, index, array) => array.indexOf(file) === index)

const suspicious = [/Ã./, /â€/, /â€¦/, /Â·/, /Å./, /Ä./]
const failures = []

for (const file of files) {
  const relative = path.relative(root, file).replace(/\\/g, '/')
  if ((baseline.mojibakeAllow ?? []).includes(relative)) continue
  const content = readFileSync(file, 'utf8')
  if (suspicious.some((pattern) => pattern.test(content))) failures.push(relative)
}

if (failures.length) {
  console.error('Possible mojibake detected:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Mojibake guard passed.')
