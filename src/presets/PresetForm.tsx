import { useState, type FormEvent } from 'react'
import { Check, ChevronDown, Minus, Plus } from 'lucide-react'
import type { Preset, Recipe } from '../data'
import { RecipeDetails } from '../components'
import { text } from '../text'

export function PresetForm({
  preset,
  recipes,
  onSave,
  onCancel,
}: {
  preset?: Preset
  recipes: Recipe[]
  onSave: (preset: Preset) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(preset?.name ?? '')
  const [recipeIds, setRecipeIds] = useState(preset?.recipeIds ?? [])
  const [openRecipe, setOpenRecipe] = useState<string | null>(null)

  function addRecipe(recipeId: string) {
    setRecipeIds([...recipeIds, recipeId])
  }

  function removeRecipe(recipeId: string) {
    const index = recipeIds.lastIndexOf(recipeId)
    if (index < 0) return

    setRecipeIds([
      ...recipeIds.slice(0, index),
      ...recipeIds.slice(index + 1),
    ])
  }

  function save(event: FormEvent) {
    event.preventDefault()
    onSave({
      id: preset?.id ?? crypto.randomUUID(),
      name: name.trim(),
      recipeIds,
    })
  }

  return (
    <form onSubmit={save} className="editor-form">
      <label>
        {text.name}
        <input
          data-autofocus
          required
          pattern=".*\S.*"
          maxLength={120}
          placeholder={text.presetPlaceholder}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <div>
        <h3>{text.chooseRecipes}</h3>
        <p className="muted">{text.chooseBody}</p>
      </div>
      <div className="selection-count">
        <Check size={16} />
        {text.selected(recipeIds.length)}
      </div>
      {recipes.length === 0 && <p className="empty-note">{text.noRecipes}</p>}
      <div className="composer-list">
        {recipes.map((recipe) => {
          const count = recipeIds.filter((id) => id === recipe.id).length
          const isSelected = count > 0
          const isOpen = openRecipe === recipe.id
          return (
            <div
              className={`composer-recipe ${isSelected ? 'is-selected' : ''}`}
              key={recipe.id}
            >
              <div className="composer-heading">
                <div
                  className="recipe-counter"
                  role="group"
                  aria-label={text.recipeQuantity(recipe.name)}
                >
                  <button
                    type="button"
                    disabled={count === 0}
                    aria-label={text.removeRecipe(recipe.name)}
                    onClick={() => removeRecipe(recipe.id)}
                  >
                    <Minus size={17} />
                  </button>
                  <span aria-live="polite">{count}</span>
                  <button
                    type="button"
                    aria-label={text.addRecipe(recipe.name)}
                    onClick={() => addRecipe(recipe.id)}
                  >
                    <Plus size={17} />
                  </button>
                </div>
                <button
                  type="button"
                  className="recipe-toggle"
                  aria-expanded={isOpen}
                  aria-controls={`composer-${recipe.id}`}
                  onClick={() => setOpenRecipe(isOpen ? null : recipe.id)}
                >
                  <span className="recipe-emoji small">{recipe.icon}</span>
                  <span className="grow">
                    <strong>{recipe.name}</strong>
                    <span className="muted block">
                      {text.ingredientCount(recipe.ingredients.length)}
                    </span>
                  </span>
                  <ChevronDown className={isOpen ? 'rotated' : ''} size={19} />
                </button>
              </div>
              <div
                className={`collapse ${isOpen ? 'expanded' : ''}`}
                id={`composer-${recipe.id}`}
                inert={!isOpen}
              >
                <div className="collapse-inner">
                  <RecipeDetails recipe={recipe} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <footer className="form-footer">
        <button type="button" className="button secondary" onClick={onCancel}>
          {text.cancel}
        </button>
        <button className="button primary">{text.savePreset}</button>
      </footer>
    </form>
  )
}
