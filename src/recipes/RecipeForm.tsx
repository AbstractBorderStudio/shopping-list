import { useState, type FormEvent } from 'react'
import { ListPlus, Plus, Trash2 } from 'lucide-react'
import { recipeIcons, type Recipe, type RecipeIcon } from '../data'
import { text } from '../text'
import { parseIngredientText } from './ingredientText'
import { parseMarkdownList } from './markdownList'

type IngredientDraft = { name: string; quantity: string; unit: string }
const blankIngredient = (): IngredientDraft => ({
  name: '',
  quantity: '',
  unit: '',
})

function MarkdownListInput({
  id,
  label,
  placeholder,
  onConvert,
}: {
  id: string
  label: string
  placeholder: string
  onConvert: (items: string[]) => string | null
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')

  function convert() {
    const items = parseMarkdownList(value)
    if (!items) {
      setError(text.invalidMarkdownList)
      return
    }

    const conversionError = onConvert(items)
    if (conversionError) {
      setError(conversionError)
      return
    }

    setValue('')
    setError('')
    setIsOpen(false)
  }

  return (
    <>
      <button
        type="button"
        className="text-button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => {
          setIsOpen(!isOpen)
          setError('')
        }}
      >
        <ListPlus size={17} />
        {text.insertList}
      </button>
      {isOpen && (
        <div className="markdown-list-editor" id={id}>
          <label>
            {label}
            <textarea
              value={value}
              placeholder={placeholder}
              onChange={(event) => setValue(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button type="button" className="button secondary" onClick={convert}>
            {text.convertList}
          </button>
        </div>
      )}
    </>
  )
}

export function RecipeForm({
  recipe,
  onSave,
  onCancel,
}: {
  recipe?: Recipe
  onSave: (recipe: Recipe) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(recipe?.name ?? '')
  const [icon, setIcon] = useState<RecipeIcon>(recipe?.icon ?? recipeIcons[0])
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    recipe?.ingredients.map((item) => ({
      name: item.name,
      quantity: item.quantity?.toString() ?? '',
      unit: item.unit ?? '',
    })) ?? [blankIngredient()],
  )
  const [steps, setSteps] = useState(recipe?.steps ?? [''])
  const [error, setError] = useState('')

  function addIngredientList(items: string[]): string | null {
    const importedIngredients: IngredientDraft[] = []
    for (const item of items) {
      const ingredient = parseIngredientText(item)
      if (!ingredient) return text.invalidIngredientList

      importedIngredients.push({
        name: ingredient.name,
        quantity: ingredient.quantity?.toString() ?? '',
        unit: ingredient.unit ?? '',
      })
    }

    const filledIngredients = ingredients.filter(
      (item) => item.name.trim() || item.quantity.trim() || item.unit.trim(),
    )
    setIngredients([...filledIngredients, ...importedIngredients])
    return null
  }

  function addStepList(items: string[]): null {
    setSteps([...steps.filter((step) => step.trim()), ...items])
    return null
  }

  function save(event: FormEvent) {
    event.preventDefault()
    const parsedIngredients = ingredients.map((item) => ({
      name: item.name.trim(),
      quantity:
        item.quantity.trim() === ''
          ? undefined
          : Number(item.quantity.replace(',', '.')),
      unit: item.unit.trim() || undefined,
    }))
    if (
      parsedIngredients.some(
        (item) =>
          item.quantity !== undefined &&
          (!Number.isFinite(item.quantity) || item.quantity < 0),
      )
    ) {
      setError(text.invalidQuantity)
      return
    }
    if (steps.some((step) => !step.trim())) {
      setError(text.invalidStep)
      return
    }

    onSave({
      id: recipe?.id ?? crypto.randomUUID(),
      name: name.trim(),
      icon,
      ingredients: parsedIngredients,
      steps: steps.map((step) => step.trim()),
    })
  }

  return (
    <form onSubmit={save} className="editor-form">
      <div className="name-row">
        <label>
          {text.icon}
          <select
            className="icon-select"
            value={icon}
            onChange={(event) => setIcon(event.target.value as RecipeIcon)}
            aria-label={text.icon}
          >
            {recipeIcons.map((recipeIcon) => (
              <option value={recipeIcon} key={recipeIcon}>
                {recipeIcon}
              </option>
            ))}
          </select>
        </label>
        <label className="grow">
          {text.name}
          <input
            data-autofocus
            required
            maxLength={120}
            pattern=".*\S.*"
            placeholder={text.recipePlaceholder}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      </div>
      <fieldset>
        <legend>{text.ingredients}</legend>
        <div className="field-list">
          {ingredients.map((ingredient, index) => (
            <div className="ingredient-fields" key={index}>
              <label className="ingredient-name">
                {text.ingredient}
                <input
                  required
                  pattern=".*\S.*"
                  maxLength={120}
                  value={ingredient.name}
                  onChange={(event) =>
                    setIngredients(
                      ingredients.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, name: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </label>
              <label>
                {text.quantity}
                <input
                  inputMode="decimal"
                  placeholder={text.optional}
                  value={ingredient.quantity}
                  onChange={(event) =>
                    setIngredients(
                      ingredients.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, quantity: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </label>
              <label>
                {text.unit}
                <input
                  maxLength={30}
                  placeholder={text.optional}
                  value={ingredient.unit}
                  onChange={(event) =>
                    setIngredients(
                      ingredients.map((item, itemIndex) =>
                        itemIndex === index
                          ? { ...item, unit: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="icon-button danger"
                disabled={ingredients.length === 1}
                aria-label={text.removeIngredient(index)}
                onClick={() =>
                  setIngredients(
                    ingredients.filter((_, itemIndex) => itemIndex !== index),
                  )
                }
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <div className="field-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => setIngredients([...ingredients, blankIngredient()])}
          >
            <Plus size={17} />
            {text.addIngredient}
          </button>
          <MarkdownListInput
            id="ingredient-list-editor"
            label={text.ingredientList}
            placeholder={text.ingredientListPlaceholder}
            onConvert={addIngredientList}
          />
        </div>
      </fieldset>
      <fieldset>
        <legend>{text.preparation}</legend>
        <div className="field-list">
          {steps.map((step, index) => (
            <div className="step-fields" key={index}>
              <label className="grow">
                {text.step} {index + 1}
                <textarea
                  required
                  maxLength={2000}
                  value={step}
                  onChange={(event) =>
                    setSteps(
                      steps.map((item, itemIndex) =>
                        itemIndex === index ? event.target.value : item,
                      ),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="icon-button danger"
                disabled={steps.length === 1}
                aria-label={text.removeStep(index)}
                onClick={() =>
                  setSteps(steps.filter((_, itemIndex) => itemIndex !== index))
                }
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
        <div className="field-actions">
          <button
            type="button"
            className="text-button"
            onClick={() => setSteps([...steps, ''])}
          >
            <Plus size={17} />
            {text.addStep}
          </button>
          <MarkdownListInput
            id="step-list-editor"
            label={text.stepList}
            placeholder={text.stepListPlaceholder}
            onConvert={addStepList}
          />
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <footer className="form-footer">
        <button type="button" className="button secondary" onClick={onCancel}>
          {text.cancel}
        </button>
        <button className="button primary">{text.saveRecipe}</button>
      </footer>
    </form>
  )
}
