import type { Ingredient } from '../data'

export function parseIngredientText(value: string): Ingredient | null {
  const nameParts: string[] = []
  let quantity: number | undefined
  let unit: string | undefined

  for (const part of value.split(/\s+/)) {
    if (part.startsWith('q=')) {
      if (quantity !== undefined || part.length === 2) return null

      quantity = Number(part.slice(2).replace(',', '.'))
      if (!Number.isFinite(quantity) || quantity < 0) return null
      continue
    }

    if (part.startsWith('u=')) {
      if (unit !== undefined || part.length === 2) return null

      unit = part.slice(2)
      continue
    }

    nameParts.push(part)
  }

  const name = nameParts.join(' ').trim()
  if (!name) return null

  return { name, quantity, unit }
}

export function serializeIngredientText(ingredient: Ingredient): string {
  return [
    ingredient.name.trim(),
    ingredient.quantity === undefined ? '' : `q=${ingredient.quantity}`,
    ingredient.unit ? `u=${ingredient.unit.trim()}` : '',
  ]
    .filter(Boolean)
    .join(' ')
}
