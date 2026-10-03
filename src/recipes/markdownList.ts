export function parseMarkdownList(value: string): string[] | null {
  const items: string[] = []

  for (const line of value.split(/\r?\n/)) {
    if (!line.trim()) continue

    const item = line.match(/^\s*[-*+]\s+(.+?)\s*$/)?.[1]
    if (item) {
      items.push(item)
      continue
    }

    const continuation = line.match(/^\s{2,}(.+?)\s*$/)?.[1]
    if (!continuation || items.length === 0) return null

    items[items.length - 1] += `\n${continuation}`
  }

  return items.length > 0 ? items : null
}

export function serializeMarkdownList(items: string[]): string {
  return items
    .map((item) => {
      const [firstLine, ...continuationLines] = item.trim().split(/\r?\n/)
      return [
        `- ${firstLine}`,
        ...continuationLines.map((line) => `  ${line}`),
      ].join('\n')
    })
    .join('\n')
}
