import { readFileSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const sourceRoot = join(projectRoot, 'src')
const baseline = JSON.parse(
  readFileSync(join(projectRoot, 'scripts/tailwind-baseline.json'), 'utf8'),
)
const legacyComponents = new Set(baseline.legacyComponentFiles)
const existingStyles = new Set(baseline.styleFiles)
const errors = []

function visit(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = join(directory, entry.name)
    if (entry.isDirectory()) {
      visit(absolutePath)
      continue
    }

    const path = relative(projectRoot, absolutePath).replaceAll('\\', '/')
    if (path.endsWith('.css') && !existingStyles.has(path)) {
      errors.push(`${path}: new component styles belong in Tailwind utilities`)
    }

    if (!path.endsWith('.tsx')) continue
    const source = readFileSync(absolutePath, 'utf8')
    if (
      path !== 'src/app/main.tsx' &&
      /import\s+['"][^'"]+\.css['"]/.test(source)
    ) {
      errors.push(
        `${path}: import the global stylesheet only from app/main.tsx`,
      )
    }
    if (
      !legacyComponents.has(path) &&
      /(?<![-\w])ui-[a-z][\w-]*/i.test(source)
    ) {
      errors.push(
        `${path}: new components must use Tailwind classes, not ui-* CSS hooks`,
      )
    }
  }
}

visit(sourceRoot)

if (errors.length > 0) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log('Tailwind component convention passed')
}
