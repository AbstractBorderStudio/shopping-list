export type Ingredient = { name: string; quantity?: number; unit?: string }
export const recipeIcons = [
  '🍝',
  '🍕',
  '🥗',
  '🍲',
  '🍚',
  '🍞',
  '🥞',
  '🍰',
  '🍎',
  '🥦',
  '🐟',
  '🍗',
] as const
export type RecipeIcon = (typeof recipeIcons)[number]

export type Recipe = {
  id: string
  name: string
  icon: RecipeIcon
  ingredients: Ingredient[]
  steps: string[]
}
export type Preset = { id: string; name: string; recipeIds: string[] }
export type Kitchen = { recipes: Recipe[]; presets: Preset[] }

export const storageKey = 'dispensa.kitchen.v1'

export function readKitchen(): Kitchen {
  const saved = localStorage.getItem(storageKey)
  if (!saved) return { recipes: [], presets: [] }

  const data: unknown = JSON.parse(saved)
  if (!isKitchen(data)) throw new Error('Invalid saved kitchen')
  return data
}

function isKitchen(value: unknown): value is Kitchen {
  if (!value || typeof value !== 'object') return false
  const data = value as Kitchen
  if (!Array.isArray(data.recipes) || !Array.isArray(data.presets)) return false

  const recipesValid = data.recipes.every(
    (recipe) =>
      recipe &&
      typeof recipe.id === 'string' &&
      typeof recipe.name === 'string' &&
      recipeIcons.includes(recipe.icon as RecipeIcon) &&
      Array.isArray(recipe.ingredients) &&
      recipe.ingredients.every(
        (ingredient) =>
          ingredient &&
          typeof ingredient.name === 'string' &&
          (ingredient.quantity === undefined ||
            (typeof ingredient.quantity === 'number' &&
              Number.isFinite(ingredient.quantity) &&
              ingredient.quantity >= 0)) &&
          (ingredient.unit === undefined ||
            typeof ingredient.unit === 'string'),
      ) &&
      Array.isArray(recipe.steps) &&
      recipe.steps.every((step) => typeof step === 'string'),
  )
  const presetsValid = data.presets.every(
    (preset) =>
      preset &&
      typeof preset.id === 'string' &&
      typeof preset.name === 'string' &&
      Array.isArray(preset.recipeIds) &&
      preset.recipeIds.every((id) => typeof id === 'string'),
  )

  return recipesValid && presetsValid
}

function normalize(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('it')
}

export function shoppingList(recipes: Recipe[]): Ingredient[] {
  const rows: Ingredient[] = []
  const quantifiedRows = new Map<string, Ingredient>()

  // group only quantities with matching names and units
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const row = {
        ...ingredient,
        name: ingredient.name.trim(),
        unit: ingredient.unit?.trim(),
      }
      if (row.quantity === undefined) {
        rows.push(row)
        continue
      }

      const key = JSON.stringify([
        normalize(row.name),
        normalize(row.unit ?? ''),
      ])
      const existing = quantifiedRows.get(key)
      if (existing) {
        const total = existing.quantity! + row.quantity
        if (Number.isFinite(total))
          existing.quantity = Number(total.toPrecision(12))
        else rows.push(row)
      } else {
        quantifiedRows.set(key, row)
        rows.push(row)
      }
    }
  }

  return rows
}

export function formatIngredient(ingredient: Ingredient): string {
  const amount =
    ingredient.quantity === undefined
      ? ''
      : ingredient.quantity.toLocaleString('it', {
          maximumSignificantDigits: 12,
        })
  return [ingredient.name, [amount, ingredient.unit].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(' · ')
}

export async function copyText(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return
    } catch {
      // try selection-based copying when clipboard permissions are unavailable
    }
  }

  const previousFocus = document.activeElement as HTMLElement | null
  const field = document.createElement('textarea')
  field.value = value
  field.style.position = 'fixed'
  field.style.opacity = '0'
  document.body.append(field)
  field.select()

  try {
    if (!document.execCommand('copy')) throw new Error('Clipboard copy failed')
  } finally {
    field.remove()
    previousFocus?.focus()
  }
}
