import { useState } from 'react'
import {
  Check,
  ChevronDown,
  Copy,
  Pencil,
  ShoppingBasket,
  Trash2,
} from 'lucide-react'
import {
  copyText,
  formatIngredient,
  shoppingList,
  type Preset,
  type Recipe,
} from '../data'
import { text } from '../text'

export function PresetCard({
  preset,
  recipes,
  onEdit,
  onDelete,
}: {
  preset: Preset
  recipes: Recipe[]
  onEdit: () => void
  onDelete: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [copiedText, setCopiedText] = useState<string | null>(null)
  const [copyError, setCopyError] = useState(false)
  const selectedRecipes = preset.recipeIds.flatMap(
    (id) => recipes.find((recipe) => recipe.id === id) ?? [],
  )
  const selectedRecipeCounts = recipes.flatMap((recipe) => {
    const count = preset.recipeIds.filter((id) => id === recipe.id).length
    return count > 0 ? [{ recipe, count }] : []
  })
  const ingredients = shoppingList(selectedRecipes)
  const listText = `${preset.name}\n${ingredients.map((ingredient) => `• ${formatIngredient(ingredient)}`).join('\n')}`
  const isCopied = copiedText === listText

  async function copy() {
    try {
      await copyText(listText)
      setCopiedText(listText)
      setCopyError(false)
    } catch {
      setCopiedText(null)
      setCopyError(true)
    }
  }

  return (
    <article className="card preset-card">
      <div className="card-heading">
        <span className="preset-icon">
          <ShoppingBasket size={24} />
        </span>
        <div className="grow">
          <h2>{preset.name}</h2>
          <p className="muted">{text.recipeCount(selectedRecipes.length)}</p>
        </div>
        <button
          className="icon-button"
          aria-label={`${text.rename} / ${text.edit} ${preset.name}`}
          onClick={onEdit}
        >
          <Pencil size={18} />
        </button>
        <button
          className="icon-button danger"
          aria-label={`${text.delete} ${preset.name}`}
          onClick={onDelete}
        >
          <Trash2 size={18} />
        </button>
      </div>
      <div className="recipe-chips">
        {selectedRecipeCounts.map(({ recipe, count }) => (
          <span key={recipe.id}>
            {recipe.icon} {recipe.name}
            {count > 1 && ` ×${count}`}
          </span>
        ))}
        {selectedRecipes.length === 0 && (
          <p className="muted">{text.noSelection}</p>
        )}
      </div>
      <button
        className="shopping-toggle"
        aria-expanded={isOpen}
        aria-controls={`shopping-${preset.id}`}
        onClick={() => {
          setIsOpen(!isOpen)
          setCopiedText(null)
          setCopyError(false)
        }}
      >
        <ShoppingBasket size={18} />
        <span className="grow">{text.shopping}</span>
        <ChevronDown className={isOpen ? 'rotated' : ''} size={18} />
      </button>
      <div
        className={`collapse ${isOpen ? 'expanded' : ''}`}
        id={`shopping-${preset.id}`}
        inert={!isOpen}
      >
        <div className="collapse-inner">
          <div className="shopping-content">
            {ingredients.length > 0 ? (
              <>
                <ul className="shopping-list">
                  {ingredients.map((ingredient, index) => (
                    <li key={index}>
                      <span className="list-dot" />
                      {formatIngredient(ingredient)}
                    </li>
                  ))}
                </ul>
                <button className="button primary copy-button" onClick={copy}>
                  {isCopied ? <Check size={18} /> : <Copy size={18} />}
                  {isCopied ? text.copied : text.copy}
                </button>
              </>
            ) : (
              <p className="muted">{text.shoppingEmpty}</p>
            )}
            <div role="status" aria-live="polite">
              {isCopied && <p className="success">{text.copied}</p>}
              {copyError && (
                <>
                  <p className="error">{text.copyError}</p>
                  <textarea
                    aria-label={text.shopping}
                    readOnly
                    value={listText}
                    onFocus={(event) => event.target.select()}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
