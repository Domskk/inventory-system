// Updated: src/components/InlineEditors.tsx
import { Item } from '../types/item'
import type { ChangeEvent, KeyboardEvent } from 'react'

interface InlineQuantityEditorProps {
  item: Item
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
}

export function InlineQuantityEditor({ value, onChange, onBlur, onKeyDown }: InlineQuantityEditorProps) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className="w-16 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-center"
      autoFocus
    />
  )
}

interface InlinePriceEditorProps {
  item: Item
  value: string
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  onBlur: () => void
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void
}

export function InlinePriceEditor({ value, onChange, onBlur, onKeyDown }: InlinePriceEditorProps) {
  return (
    <input
      type="number"
      min={0}
      step="0.01"
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      className="w-20 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-right"
      autoFocus
    />
  )
}

interface InlineImageEditorProps {
  item: Item
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

export function InlineImageEditor({onChange }: InlineImageEditorProps) {
  return (
    <input
      type="file"
      accept="image/*"
      onChange={onChange}
      className="text-sm file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
    />
  )
}