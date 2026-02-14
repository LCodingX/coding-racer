'use client'

import { useState, useEffect } from 'react'
import { Save, Trash2 } from 'lucide-react'
import { saveTemplate, deleteTemplate, getTemplate } from '../lib/storage'

interface TemplateEditorProps {
  templateId: string
  onClose: () => void
}

export default function TemplateEditor({ templateId, onClose }: TemplateEditorProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    const load = async () => {
      const template = await getTemplate(templateId)
      if (template) {
        setContent(template.content)
      } else {
        setIsNew(true)
        setContent('')
      }
      setLoading(false)
    }
    load()
  }, [templateId])

  const handleSave = async () => {
    setSaving(true)
    await saveTemplate(templateId, content)
    setSaving(false)
    setIsNew(false)
  }

  const handleDelete = async () => {
    if (confirm(`Delete "${templateId}"?`)) {
      await deleteTemplate(templateId)
      onClose()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      const newContent = content.substring(0, start) + '\t' + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 1
      }, 0)
    }
    if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSave()
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-400">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isNew ? 'New Template' : 'Edit Template'}
          </h2>
          <span className="text-sm text-gray-400 font-mono">{templateId}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors shadow-sm"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save'}
          </button>
          {!isNew && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-500 text-sm font-medium transition-colors"
            >
              <Trash2 size={16} />
              Delete
            </button>
          )}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        className="w-full h-[calc(100vh-12rem)] p-4 bg-white border border-gray-200 rounded-xl font-mono text-sm text-gray-900 resize-none focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 placeholder-gray-400 shadow-sm"
        placeholder="Paste or type your code template here..."
        spellCheck={false}
        autoFocus
      />
    </div>
  )
}
