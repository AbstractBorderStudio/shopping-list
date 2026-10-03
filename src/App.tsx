import { useRef, useState, type ChangeEvent } from 'react'
import {
  ArrowUpRight,
  BookOpen,
  ChefHat,
  Download,
  Leaf,
  Pencil,
  Plus,
  ShoppingBasket,
  Trash2,
  Upload,
} from 'lucide-react'
import { Modal, RecipeDetails } from './components'
import {
  readKitchen,
  storageKey,
  type Kitchen,
  type Preset,
  type Recipe,
} from './data'
import { RecipeForm } from './recipes/RecipeForm'
import { isBaseRecipe, readBaseRecipes } from './recipes/baseRecipes'
import { parseRecipesCsv, serializeRecipesCsv } from './recipes/recipeCsv'
import { PresetForm } from './presets/PresetForm'
import { PresetCard } from './presets/PresetCard'
import { text } from './text'

type Editor =
  { type: 'recipe'; recipe?: Recipe } | { type: 'preset'; preset?: Preset }

function loadKitchen() {
  let baseRecipes: Recipe[] = []
  let baseRecipesError = ''
  try {
    baseRecipes = readBaseRecipes()
  } catch {
    baseRecipesError = text.baseRecipesReadError
  }

  try {
    return { baseRecipes, kitchen: readKitchen(), error: baseRecipesError }
  } catch {
    return {
      baseRecipes,
      kitchen: { recipes: [], presets: [] } as Kitchen,
      error: text.storageReadError,
    }
  }
}

export function App() {
  const [initial] = useState(loadKitchen)
  const [baseRecipes] = useState(initial.baseRecipes)
  const [kitchen, setKitchen] = useState(initial.kitchen)
  const [storageError, setStorageError] = useState(initial.error)
  const [recipeTransferError, setRecipeTransferError] = useState('')
  const [tab, setTab] = useState<'recipes' | 'presets'>('recipes')
  const [editor, setEditor] = useState<Editor | null>(null)
  const [detailRecipe, setDetailRecipe] = useState<Recipe | null>(null)
  const recipeFileInput = useRef<HTMLInputElement>(null)
  const recipes = [...baseRecipes, ...kitchen.recipes]

  function saveKitchen(next: Kitchen) {
    setKitchen(next)
    try {
      localStorage.setItem(storageKey, JSON.stringify(next))
      setStorageError('')
    } catch {
      setStorageError(text.storageWriteError)
    }
  }

  function saveRecipe(recipe: Recipe) {
    const exists = kitchen.recipes.some((item) => item.id === recipe.id)
    saveKitchen({
      ...kitchen,
      recipes: exists
        ? kitchen.recipes.map((item) => (item.id === recipe.id ? recipe : item))
        : [...kitchen.recipes, recipe],
    })
    setEditor(null)
  }

  function deleteRecipe(recipe: Recipe) {
    if (!window.confirm(text.deleteRecipe)) return
    saveKitchen({
      recipes: kitchen.recipes.filter((item) => item.id !== recipe.id),
      presets: kitchen.presets.map((preset) => ({
        ...preset,
        recipeIds: preset.recipeIds.filter((id) => id !== recipe.id),
      })),
    })
  }

  async function importRecipes(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const recipes = parseRecipesCsv(await file.text())
      saveKitchen({ ...kitchen, recipes: [...kitchen.recipes, ...recipes] })
      setRecipeTransferError('')
    } catch {
      setRecipeTransferError(text.recipeImportError)
    }
  }

  function exportRecipes() {
    try {
      const csv = `\uFEFF${serializeRecipesCsv(kitchen.recipes)}`
      const url = URL.createObjectURL(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = 'dispensa-ricette.csv'
      document.body.append(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setRecipeTransferError('')
    } catch {
      setRecipeTransferError(text.recipeExportError)
    }
  }

  function savePreset(preset: Preset) {
    const exists = kitchen.presets.some((item) => item.id === preset.id)
    saveKitchen({
      ...kitchen,
      presets: exists
        ? kitchen.presets.map((item) => (item.id === preset.id ? preset : item))
        : [...kitchen.presets, preset],
    })
    setEditor(null)
  }

  function deletePreset(preset: Preset) {
    if (!window.confirm(text.deletePreset)) return
    saveKitchen({
      ...kitchen,
      presets: kitchen.presets.filter((item) => item.id !== preset.id),
    })
  }

  const isRecipes = tab === 'recipes'
  const isEmpty = isRecipes
    ? recipes.length === 0
    : kitchen.presets.length === 0
  const create = () =>
    setEditor(isRecipes ? { type: 'recipe' } : { type: 'preset' })

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="./">
          <span>
            <Leaf size={23} />
          </span>
          {text.brand}
          <span className="brand-dot">.</span>
        </a>
        <span className="local-note">
          <span className="status-dot" />
          {text.local}
        </span>
      </header>
      <main>
        <section className="hero">
          <div className="eyebrow">
            <ChefHat size={17} />
            {text.tagline}
          </div>
          <h1>{text.intro}</h1>
          <p>{isRecipes ? text.recipeIntro : text.presetIntro}</p>
          <div className="hero-mark" aria-hidden="true">
            ✳
          </div>
        </section>
        <nav className="tabs" aria-label={text.navigation}>
          <button
            aria-current={isRecipes ? 'page' : undefined}
            className={isRecipes ? 'active' : ''}
            onClick={() => setTab('recipes')}
          >
            <BookOpen size={18} />
            {text.recipes}
            <span>{recipes.length}</span>
          </button>
          <button
            aria-current={!isRecipes ? 'page' : undefined}
            className={!isRecipes ? 'active' : ''}
            onClick={() => setTab('presets')}
          >
            <ShoppingBasket size={18} />
            {text.presets}
            <span>{kitchen.presets.length}</span>
          </button>
        </nav>
        {storageError && (
          <div className="error storage-error" role="alert">
            <p>{storageError}</p>
            {storageError === text.storageWriteError && (
              <button
                className="text-button"
                onClick={() => saveKitchen(kitchen)}
              >
                {text.retrySave}
              </button>
            )}
          </div>
        )}
        {recipeTransferError && (
          <div className="error storage-error" role="alert">
            {recipeTransferError}
          </div>
        )}
        <section
          className="workspace"
          aria-label={isRecipes ? text.recipes : text.presets}
        >
          <div className="section-heading">
            <div>
              <h2>{isRecipes ? text.recipes : text.presets}</h2>
              <p className="muted">
                {isRecipes
                  ? text.recipeCount(recipes.length)
                  : text.presetCount(kitchen.presets.length)}
              </p>
            </div>
            <div className="section-actions">
              {isRecipes && (
                <>
                  <input
                    hidden
                    ref={recipeFileInput}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={importRecipes}
                  />
                  <button
                    className="button secondary"
                    onClick={() => recipeFileInput.current?.click()}
                  >
                    <Upload size={18} />
                    {text.importCsv}
                  </button>
                  <button
                    className="button secondary"
                    disabled={kitchen.recipes.length === 0}
                    onClick={exportRecipes}
                  >
                    <Download size={18} />
                    {text.exportCsv}
                  </button>
                </>
              )}
              <button className="button primary" onClick={create}>
                <Plus size={18} />
                {isRecipes ? text.newRecipe : text.newPreset}
              </button>
            </div>
          </div>
          {isEmpty ? (
            <div className="empty-state">
              <div className="empty-illustration" aria-hidden="true">
                <span>{isRecipes ? '🍋' : '🧺'}</span>
                <span className="sparkle">✧</span>
              </div>
              <h2>{isRecipes ? text.emptyRecipes : text.emptyPresets}</h2>
              <p>{isRecipes ? text.emptyRecipesBody : text.emptyPresetsBody}</p>
              <button className="button secondary" onClick={create}>
                {isRecipes ? text.newRecipe : text.newPreset}
                <ArrowUpRight size={18} />
              </button>
            </div>
          ) : (
            <div className="card-grid">
              {isRecipes
                ? recipes.map((recipe) => (
                    <article className="card recipe-card" key={recipe.id}>
                      <button
                        className="recipe-preview"
                        onClick={() => setDetailRecipe(recipe)}
                        aria-label={text.details(recipe.name)}
                      >
                        <span className="recipe-emoji">{recipe.icon}</span>
                        <h2>{recipe.name}</h2>
                        <p className="muted">
                          {text.ingredientCount(recipe.ingredients.length)}
                        </p>
                        <span className="preview-link">
                          {text.preparation}
                          <ArrowUpRight size={17} />
                        </span>
                      </button>
                      {isBaseRecipe(recipe) ? (
                        <div className="card-actions base-recipe-note">
                          {text.baseRecipe}
                        </div>
                      ) : (
                        <div className="card-actions">
                          <button
                            className="text-button"
                            onClick={() =>
                              setEditor({ type: 'recipe', recipe })
                            }
                          >
                            <Pencil size={16} />
                            {text.edit}
                          </button>
                          <button
                            className="icon-button danger"
                            aria-label={`${text.delete} ${recipe.name}`}
                            onClick={() => deleteRecipe(recipe)}
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                : kitchen.presets.map((preset) => (
                    <PresetCard
                      key={preset.id}
                      preset={preset}
                      recipes={recipes}
                      onEdit={() => setEditor({ type: 'preset', preset })}
                      onDelete={() => deletePreset(preset)}
                    />
                  ))}
            </div>
          )}
        </section>
      </main>
      <footer className="site-footer">
        <Leaf size={15} />
        {text.tagline}
      </footer>
      {editor?.type === 'recipe' && (
        <Modal
          title={editor.recipe ? text.editRecipe : text.newRecipe}
          onClose={() => setEditor(null)}
        >
          <RecipeForm
            recipe={editor.recipe}
            onSave={saveRecipe}
            onCancel={() => setEditor(null)}
          />
        </Modal>
      )}
      {editor?.type === 'preset' && (
        <Modal
          title={editor.preset ? text.editPreset : text.newPreset}
          onClose={() => setEditor(null)}
        >
          <PresetForm
            preset={editor.preset}
            recipes={recipes}
            onSave={savePreset}
            onCancel={() => setEditor(null)}
          />
        </Modal>
      )}
      {detailRecipe && (
        <Modal
          title={`${detailRecipe.icon} ${detailRecipe.name}`}
          onClose={() => setDetailRecipe(null)}
        >
          <RecipeDetails recipe={detailRecipe} />
        </Modal>
      )}
    </div>
  )
}
