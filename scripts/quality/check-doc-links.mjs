import { readFileSync, readdirSync, existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()

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

const docFiles = [
  path.join(root, 'README.md'),
  path.join(root, 'RULES.md'),
  ...walk(path.join(root, 'docs'))
].filter((file) => /\.(md)$/.test(file))

const failures = []

for (const file of docFiles) {
  const relative = path.relative(root, file).replace(/\\/g, '/')
  const content = readFileSync(file, 'utf8')
  const matches = [...content.matchAll(/\[[^\]]+\]\((\.\/|\.\.\/)([^)]+)\)/g)]
  for (const match of matches) {
    const targetPath = match[2].split('#')[0]
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(relative), targetPath))
    if (!existsSync(path.join(root, target))) failures.push(`${relative} -> ${target}`)
  }
}

if (failures.length) {
  console.error('Broken documentation links detected:')
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log('Documentation link guard passed.')
