#!/usr/bin/env node
// Builds the plugin marketplace from `.claude/skills/` (the source of truth) + `groups.json`.
//
// Edit skills in `.claude/skills/` and bundles in `groups.json`, then run:
//   node scripts/build-store.mjs         (or: npm run build)
//   node scripts/build-store.mjs --ci    (exit non-zero on any warning — for CI gates)
//
// Everything under `plugins/` and `.claude-plugin/marketplace.json` is GENERATED —
// do not hand-edit it; your changes will be overwritten on the next build.

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  cpSync,
  existsSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)))
const SKILLS_DIR = join(ROOT, '.claude', 'skills')
const COMMANDS_DIR = join(ROOT, '.claude', 'commands')
const PLUGINS_DIR = join(ROOT, 'plugins')
const MARKETPLACE_FILE = join(ROOT, '.claude-plugin', 'marketplace.json')
const GROUPS_FILE = join(ROOT, 'groups.json')
const ITEMS_FILE = join(ROOT, 'items.json')
const README_FILE = join(ROOT, 'README.md')
const CI_MODE = process.argv.includes('--ci')

// --- marketplace identity (edit these if your repo/owner changes) ---
const MARKETPLACE_NAME = 'timonwa-skills'
const OWNER = { name: 'Timonwa' }
const REPO_URL = 'https://github.com/Timonwa/timonwa-skills'

/** Pull `name`, `description`, and `metadata.version`/`metadata.source`/`metadata.author` out of a SKILL.md frontmatter block.
 *  Handles plain, quoted, and block scalars (`>`, `>-`, `|`, `|-`) — the previous single-line regex
 *  read a folded `description: >-` as the literal string ">-". */
function parseFrontmatter(md) {
  const match = md.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match) return {}
  const lines = match[1].split(/\r?\n/)
  const out = {}
  let inMetadata = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\S/.test(line)) inMetadata = false
    if (/^metadata:\s*$/.test(line)) {
      inMetadata = true
      continue
    }
    if (inMetadata) {
      const metaChild = line.match(/^\s+(version|source|author):\s*(.*)$/)
      if (metaChild) out[metaChild[1]] = unquote(metaChild[2])
      continue
    }
    const top = line.match(/^(name|description):\s*(.*)$/)
    if (!top) continue
    const key = top[1]
    const value = top[2].trim()
    const block = value.match(/^([>|])[+-]?$/)
    if (!block) {
      out[key] = unquote(value)
      continue
    }
    // Block scalar: consume every following line that is blank or more-indented.
    const chunk = []
    while (i + 1 < lines.length && (/^\s+\S/.test(lines[i + 1]) || /^\s*$/.test(lines[i + 1]))) {
      chunk.push(lines[++i])
    }
    const nonEmpty = chunk.filter((l) => l.trim())
    const indent = nonEmpty.length ? Math.min(...nonEmpty.map((l) => l.match(/^\s*/)[0].length)) : 0
    const stripped = chunk.map((l) => l.slice(indent))
    out[key] =
      block[1] === '>'
        ? stripped
            .map((l) => l.trim())
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim() // folded: newlines become spaces
        : stripped.join('\n').trim() // literal: keep newlines
  }
  return out
}

function unquote(s) {
  const t = s.trim()
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1)
  }
  return t
}

/** Sentence split that doesn't break on abbreviations (e.g., i.e., vs.) or dotted names (Next.js). */
function splitSentences(text) {
  const parts = []
  let start = 0
  const re = /[.!?](?=\s+["'`(A-Z])/g
  let m
  while ((m = re.exec(text))) {
    const candidate = text.slice(start, m.index + 1)
    if (/\b(e\.g|i\.e|vs|etc|cf|incl)\.$/i.test(candidate)) continue
    if (/\b\d+(\.\d+)*\.$/.test(candidate)) continue // version numbers like "2.0."
    parts.push(candidate.trim())
    start = m.index + 1
  }
  const rest = text.slice(start).trim()
  if (rest) parts.push(rest)
  return parts
}

/** First one or two meaningful sentences (cap 160 chars) — keeps the browse menu readable.
 *  Skips leading boilerplate sentences ("Manually invoked.") that would otherwise become
 *  the whole description for every audit skill. */
function shortDesc(desc) {
  if (!desc) return ''
  const sentences = splitSentences(desc.trim())
  while (sentences.length > 1 && sentences[0].split(/\s+/).length <= 3) sentences.shift()
  let s = sentences[0] || ''
  if (sentences[1] && `${s} ${sentences[1]}`.length <= 160) s = `${s} ${sentences[1]}`
  if (s.length > 160) s = s.slice(0, 159).trimEnd() + '…'
  return s
}

/** Highest semver-ish version among members — gives bundles a version that moves when any member does. */
function maxVersion(versions) {
  const parse = (v) =>
    String(v)
      .split('.')
      .map((n) => parseInt(n, 10) || 0)
  return versions
    .filter(Boolean)
    .sort((a, b) => {
      const [pa, pb] = [parse(a), parse(b)]
      for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
        if ((pa[i] || 0) !== (pb[i] || 0)) return (pa[i] || 0) - (pb[i] || 0)
      }
      return 0
    })
    .pop()
}

const notDsStore = (src) => !src.endsWith('.DS_Store')

const warnings = []
const errors = []

// --- read every skill folder that has a SKILL.md ---
// Keyed by folder name — the folder name is the plugin id. Frontmatter `name` MUST equal the
// folder name (CONVENTIONS.md: "Folder name = invocation name"), or the /name and plugin id diverge.
const skills = new Map()
for (const dirName of readdirSync(SKILLS_DIR).sort()) {
  const dir = join(SKILLS_DIR, dirName)
  const skillFile = join(dir, 'SKILL.md')
  if (!existsSync(skillFile)) continue
  const fm = parseFrontmatter(readFileSync(skillFile, 'utf8'))
  if (fm.name && fm.name !== dirName) {
    errors.push(
      `skill "${dirName}": frontmatter name "${fm.name}" ≠ folder name — fix the frontmatter (folder name = invocation name)`
    )
  }
  if (!fm.description)
    warnings.push(`skill "${dirName}": missing description — it will be unbrowsable in /plugin`)
  if (!fm.version)
    warnings.push(`skill "${dirName}": missing metadata.version — publishes unversioned`)
  skills.set(dirName, {
    id: dirName,
    dir,
    description: fm.description || '',
    version: fm.version,
    source: fm.source,
    author: fm.author,
  })
}

// --- read every command file ---
// A command is a single markdown file, invoked BARE (`/name`) rather than namespaced
// `/plugin:name` the way a plugin skill is — which is why the manually-invoked actions
// (the audits) live here. Its invocation name comes from the FILENAME; frontmatter `name`
// is only a display label. Commands cannot carry supporting files: anything needing a
// `references/` folder has to be a skill.
// Repo-maintenance tools that exist to build THIS library, not to ship in it.
const PRIVATE_COMMANDS = new Set(['audit-item'])

for (const fileName of readdirSync(COMMANDS_DIR).sort()) {
  if (!fileName.endsWith('.md')) continue
  const id = fileName.slice(0, -3)
  if (PRIVATE_COMMANDS.has(id)) continue
  const file = join(COMMANDS_DIR, fileName)
  const fm = parseFrontmatter(readFileSync(file, 'utf8'))
  if (fm.name && fm.name !== id) {
    errors.push(
      `command "${id}": frontmatter name "${fm.name}" ≠ file name — the file name is the command, so they must match`
    )
  }
  if (skills.has(id)) {
    errors.push(`"${id}" exists as both a skill and a command — one id, one kind`)
  }
  if (!fm.description)
    warnings.push(`command "${id}": missing description — unbrowsable in /plugin`)
  if (!fm.version)
    warnings.push(`command "${id}": missing metadata.version — publishes unversioned`)
  skills.set(id, {
    id,
    file, // a command is one file, not a directory
    isCommand: true,
    description: fm.description || '',
    version: fm.version,
    source: fm.source,
    author: fm.author,
  })
}

const groups = existsSync(GROUPS_FILE) ? JSON.parse(readFileSync(GROUPS_FILE, 'utf8')) : {}

if (errors.length) {
  console.error('Build failed:\n' + errors.map((e) => `  - ${e}`).join('\n'))
  process.exit(1)
}

// --- wipe and rebuild the generated output ---
rmSync(PLUGINS_DIR, { recursive: true, force: true })
mkdirSync(PLUGINS_DIR, { recursive: true })

const entries = []

/** Write one plugin folder: its manifest + copies of the given skill dirs.
 *  `license`/`repository` are only claimed for own/adapted content (author === OWNER.name) —
 *  a vendored skill's real license belongs to its upstream, not to this repo's MIT grant. */
function writePlugin(pluginName, description, memberNames, version, source, author) {
  const pluginDir = join(PLUGINS_DIR, pluginName)
  mkdirSync(join(pluginDir, '.claude-plugin'), { recursive: true })
  const manifest = { name: pluginName, description }
  if (version) manifest.version = version
  // Claude Code's schema requires an object here — a plain string fails installation
  // with "Invalid input: expected object, received string".
  if (author) manifest.author = { name: author }
  if (source) manifest.source = source // upstream attribution for adopted-unedited skills
  if (!author || author === OWNER.name) {
    manifest.license = 'MIT'
    manifest.repository = REPO_URL
  }
  writeFileSync(
    join(pluginDir, '.claude-plugin', 'plugin.json'),
    JSON.stringify(manifest, null, 2) + '\n'
  )
  for (const member of memberNames) {
    const skill = skills.get(member)
    if (!skill) {
      warnings.push(`group/skill "${pluginName}" references missing skill "${member}" — skipped`)
      continue
    }
    if (skill.isCommand) {
      // Commands land flat in `commands/`, so they stay invocable as bare `/name`.
      mkdirSync(join(pluginDir, 'commands'), { recursive: true })
      cpSync(skill.file, join(pluginDir, 'commands', `${member}.md`))
    } else {
      cpSync(skill.dir, join(pluginDir, 'skills', member), { recursive: true, filter: notDsStore })
    }
  }
  entries.push({ name: pluginName, source: `./plugins/${pluginName}`, description })
}

// one standalone plugin per skill
for (const skill of skills.values()) {
  writePlugin(
    skill.id,
    shortDesc(skill.description),
    [skill.id],
    skill.version,
    skill.source,
    skill.author
  )
}

/** Resolve a group's full member list: its own `skills` plus every skill of the groups it `includes`
 *  (recursively, deduped) — so a composite like fullstack-suite can never drift from its parts.
 *
 *  `"skills": "*"` means every publishable skill and command, resolved at build time. This is a
 *  LOCAL convention, not part of Claude Code's plugin spec — that spec has no wildcard and no
 *  bundle concept, so every group here is emitted as a real plugin with its member files copied
 *  in. Use `"*"` only where the definition genuinely IS "all of them"; a curated suite keeps its
 *  explicit list, because there the list is the curation. Anything withheld from publishing
 *  (PRIVATE_COMMANDS) is already absent from `skills`, so `"*"` cannot leak it. */
function resolveMembers(groupName, seen = new Set()) {
  if (seen.has(groupName)) {
    warnings.push(`group "${groupName}": circular includes — skipped the cycle`)
    return []
  }
  seen.add(groupName)
  const group = groups[groupName]
  if (!group) {
    warnings.push(`group includes unknown group "${groupName}" — skipped`)
    return []
  }
  if (group.skills === '*') {
    // Group names are excluded too, so a "*" group can never nest another bundle inside itself.
    return [...skills.keys()].filter((id) => !groups[id]).sort()
  }
  const members = new Set(group.skills || [])
  for (const inc of group.includes || []) {
    for (const m of resolveMembers(inc, seen)) members.add(m)
  }
  return [...members].sort()
}

// one plugin per group bundle — only emit a bundle once enough of its skills exist that the
// bundle delivers on its description (a 1-skill "marketing suite" is a broken promise in /plugin)
const MIN_BUNDLE_MEMBERS = 2
for (const [groupName, group] of Object.entries(groups)) {
  if (skills.has(groupName)) {
    warnings.push(`group "${groupName}" clashes with a skill name — rename the group`)
    continue
  }
  const members = resolveMembers(groupName)
  const present = members.filter((m) => skills.has(m))
  if (present.length === 0) continue // nothing to bundle yet (e.g. members still under review in _old/)
  if (present.length < MIN_BUNDLE_MEMBERS) {
    warnings.push(
      `bundle "${groupName}": only ${present.length} of ${members.length} skills present — skipped until it has ${MIN_BUNDLE_MEMBERS}+`
    )
    continue
  }
  const version = group.version || maxVersion(present.map((m) => skills.get(m).version))
  writePlugin(
    groupName,
    group.description || `${group.displayName || groupName} bundle`,
    present,
    version,
    undefined,
    OWNER.name
  )
  const missing = members.filter((m) => !skills.has(m))
  if (missing.length)
    warnings.push(
      `bundle "${groupName}": ${present.length} included, ${missing.length} not yet present (${missing.join(', ')})`
    )
}

entries.sort((a, b) => a.name.localeCompare(b.name))

mkdirSync(dirname(MARKETPLACE_FILE), { recursive: true })
writeFileSync(
  MARKETPLACE_FILE,
  JSON.stringify(
    {
      name: MARKETPLACE_NAME,
      owner: OWNER,
      description: `${skills.size} Claude Code skills by ${OWNER.name} — ${REPO_URL}`,
      plugins: entries,
    },
    null,
    2
  ) + '\n'
)

// --- regenerate the README's item table ---
// The one-line "Owns" summary is hand-written (frontmatter descriptions are far too long
// for a table), so it lives in items.json and is looked up here. Everything else — the
// name, the kind, the link — comes from what was just scanned, so adding an item cannot
// leave the README stale. CI fails on an uncommitted regeneration.
const ITEM_START = '<!-- BEGIN GENERATED ITEMS -->'
const ITEM_END = '<!-- END GENERATED ITEMS -->'
if (existsSync(README_FILE)) {
  const readme = readFileSync(README_FILE, 'utf8')
  const a = readme.indexOf(ITEM_START)
  const b = readme.indexOf(ITEM_END)
  if (a === -1 || b === -1) {
    warnings.push(
      `README.md: missing ${ITEM_START} / ${ITEM_END} markers — item table not regenerated`
    )
  } else {
    const owns = existsSync(ITEMS_FILE) ? JSON.parse(readFileSync(ITEMS_FILE, 'utf8')) : {}
    const rows = [...skills.values()]
      .sort((x, y) => x.id.localeCompare(y.id))
      .map((item) => {
        if (!owns[item.id]) warnings.push(`items.json: no summary for "${item.id}" — add one`)
        const path = item.isCommand ? `.claude/commands/${item.id}.md` : `.claude/skills/${item.id}`
        const kind = item.isCommand ? 'command' : 'skill'
        // Blank for our own work; a vendored item credits its author and links upstream,
        // so the table itself answers "who wrote this?" without opening the file.
        const by =
          !item.author || item.author === OWNER.name
            ? ''
            : item.source
              ? `[${item.author}](${item.source})`
              : item.author
        return [`[${item.id}](${path})`, kind, owns[item.id] || 'TODO', by]
      })
    // Pad the columns the way Prettier would, so `npm run build` and `npm run format`
    // don't fight each other over the same table forever.
    const cells = [['Item', 'Kind', 'Owns', 'By'], null, ...rows]
    const widths = cells
      .filter(Boolean)
      .reduce((acc, r) => r.map((c, i) => Math.max(acc[i] || 0, c.length)), [])
    const line = (r) => `| ${r.map((c, i) => c.padEnd(widths[i])).join(' | ')} |`
    const table = cells
      .map((r) => (r ? line(r) : line(widths.map((w) => '-'.repeat(w)))))
      .join('\n')
    writeFileSync(
      README_FILE,
      readme.slice(0, a) + ITEM_START + '\n\n' + table + '\n\n' + readme.slice(b)
    )
  }
}

console.log(
  `Built ${skills.size} skills + ${Object.keys(groups).length} groups → ${entries.length} installable plugins.`
)
if (warnings.length) {
  console.log('\nWarnings:\n' + warnings.map((w) => `  - ${w}`).join('\n'))
  if (CI_MODE) process.exit(1)
}
