import baseRecipesCsv from '../assets/base_recipes.csv?raw'
import type { Recipe } from '../data'
import { parseRecipesCsv } from './recipeCsv'

const baseRecipeIdPrefix = 'base:'

export function readBaseRecipes(): Recipe[] {
  const recipeIds = new Set<string>()

  return parseRecipesCsv(baseRecipesCsv, (name) => {
    const id = `${baseRecipeIdPrefix}${encodeURIComponent(normalizeName(name))}`
    if (recipeIds.has(id)) throw new Error(`Duplicate base recipe: ${name}`)

    recipeIds.add(id)
    return id
  })
}

export function isBaseRecipe(recipe: Recipe): boolean {
  return recipe.id.startsWith(baseRecipeIdPrefix)
}

function normalizeName(value: string): string {
  return value
    .normalize('NFKC')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase('it')
}
