import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const baselinePath = path.join(root, 'quality-baseline.json')
const baseline = existsSync(baselinePath) ? JSON.parse(readFileSync(baselinePath, 'utf8')) : { runtimeAny: [] }

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

const files = walk(path.join(root, 'src'))
  .filter((file) => /\.(ts|tsx)$/.test(file))
  .filter((file) => !/\.test\./.test(file))
  .filter((file) => !file.endsWith(path.join('src', 'lib', 'supabase', 'database.types.ts')))

const linePatterns = [/\bany\b/, /as any/, /: any/, /Map<string, any>/]
const allowed = new Map((baseline.runtimeAny ?? []).map((entry) => [entry.file, new Set(entry.snippets)]))
const failures = []

for (const file of files) {
  const relative = path.relative(root, file).replace(/\\/g, '/')
  const lines = readFileSync(file, 'utf8').split(/\r?\n/)
  for (let index = 0; index < lines.length; index += 1) {
    const content = lines[index].trim()
    if (!linePatterns.some((pattern) => pattern.test(content))) continue
    if (allowed.get(relative)?.has(content)) continue
    failures.push(`${relative}:${index + 1}:${content}`)
  }
}

if (failures.length) {
  console.error('New runtime any usage detected:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Runtime any guard passed.')
