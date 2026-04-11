import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const baselinePath = path.join(root, 'quality-baseline.json')
const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : { largeFiles: {} }

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

const files = walk(path.join(root, 'src')).filter((file) => /\.(ts|tsx)$/.test(file))
const defaultLimit = 350
const failures = []

for (const file of files) {
  const relative = path.relative(root, file).replace(/\\/g, '/')
  const lines = readFileSync(file, 'utf8').split(/\r?\n/).length
  const allowed = baseline.largeFiles?.[relative] ?? defaultLimit
  if (lines > allowed) failures.push(`${relative}: ${lines} lines exceeds allowed ${allowed}`)
}

if (failures.length) {
  console.error('File size guard failed:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('File size guard passed.')
