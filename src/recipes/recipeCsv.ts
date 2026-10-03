import { recipeIcons, type Recipe } from '../data'
import {
  parseIngredientText,
  serializeIngredientText,
} from './ingredientText'
import { parseMarkdownList, serializeMarkdownList } from './markdownList'

const header = ['nome', 'ingredienti', 'steps']
type RecipeIdFactory = (name: string, index: number) => string

export function parseRecipesCsv(
  value: string,
  createId: RecipeIdFactory = () => crypto.randomUUID(),
): Recipe[] {
  const rows = parseCsv(value).filter((row) =>
    row.some((field) => field.trim()),
  )
  if (rows.length < 2) throw new Error('Missing recipe rows')

  const parsedHeader = rows[0].map((field, index) =>
    (index === 0 ? field.replace(/^\uFEFF/, '') : field)
      .trim()
      .toLocaleLowerCase('it'),
  )
  if (
    parsedHeader.length !== header.length ||
    parsedHeader.some((field, index) => field !== header[index])
  ) {
    throw new Error('Invalid CSV header')
  }

  return rows
    .slice(1)
    .map((row, index) => parseRecipeRow(row, createId, index))
}

export function serializeRecipesCsv(recipes: Recipe[]): string {
  const rows = [
    header,
    ...recipes.map((recipe) => [
      recipe.name,
      serializeMarkdownList(recipe.ingredients.map(serializeIngredientText)),
      serializeMarkdownList(recipe.steps),
    ]),
  ]

  return `${rows.map((row) => row.map(escapeCsvField).join(',')).join('\r\n')}\r\n`
}

function parseRecipeRow(
  row: string[],
  createId: RecipeIdFactory,
  index: number,
): Recipe {
  if (row.length !== header.length) throw new Error('Invalid recipe row')

  const [nameValue, ingredientValue, stepValue] = row
  const name = nameValue.trim()
  const ingredientItems = parseMarkdownList(ingredientValue)
  const steps = parseMarkdownList(stepValue)
  if (!name || !ingredientItems || !steps) throw new Error('Invalid recipe')

  return {
    id: createId(name, index),
    name,
    icon: recipeIcons[0],
    ingredients: ingredientItems.map((item) => {
      const ingredient = parseIngredientText(item)
      if (!ingredient) throw new Error('Invalid ingredient')
      return ingredient
    }),
    steps,
  }
}

function escapeCsvField(value: string): string {
  if (!/[",\r\n]/.test(value)) return value
  return `"${value.replaceAll('"', '""')}"`
}

function parseCsv(value: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let isQuoted = false
  let quoteClosed = false

  function finishField() {
    row.push(field)
    field = ''
    quoteClosed = false
  }

  function finishRow() {
    finishField()
    rows.push(row)
    row = []
  }

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]

    if (isQuoted) {
      if (character !== '"') {
        field += character
        continue
      }

      if (value[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        isQuoted = false
        quoteClosed = true
      }
      continue
    }

    if (
      quoteClosed &&
      character !== ',' &&
      character !== '\r' &&
      character !== '\n'
    )
      throw new Error('Invalid character after quote')

    if (character === '"') {
      if (field) throw new Error('Invalid quote')
      isQuoted = true
    } else if (character === ',') {
      finishField()
    } else if (character === '\r' || character === '\n') {
      if (character === '\r' && value[index + 1] === '\n') index += 1
      finishRow()
    } else {
      field += character
    }
  }

  if (isQuoted) throw new Error('Unclosed quote')
  if (field || row.length > 0 || quoteClosed) finishRow()

  return rows
}
