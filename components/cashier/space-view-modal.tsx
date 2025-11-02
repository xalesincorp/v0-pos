"use client"

import type React from "react"

import { X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface Shape {
  id: string
  type: "rectangle"
  x: number
  y: number
  width: number
  height: number
  name: string
}

interface SpaceViewModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SpaceViewModal({ isOpen, onClose }: SpaceViewModalProps) {
  const [activeTab, setActiveTab] = useState("space")
  const [tabs, setTabs] = useState([{ id: "space", name: "Space" }])
  const [tabShapes, setTabShapes] = useState<Record<string, Shape[]>>({ space: [] })

  const [isEditMode, setIsEditMode] = useState(false)
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTabName, setEditingTabName] = useState("")
  const [draggedShapeId, setDraggedShapeId] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  const [editingShapeId, setEditingShapeId] = useState<string | null>(null)
  const [editingShapeName, setEditingShapeName] = useState("")

  if (!isOpen) return null

  const handleStartEdit = (tabId: string, currentName: string) => {
    setEditingTabId(tabId)
    setEditingTabName(currentName)
  }

  const handleSaveTabName = () => {
    if (editingTabId && editingTabName.trim()) {
      setTabs(tabs.map((tab) => (tab.id === editingTabId ? { ...tab, name: editingTabName } : tab)))
    }
    setEditingTabId(null)
    setEditingTabName("")
  }

  const handleAddSpace = () => {
    const newId = `space-${Date.now()}`
    setTabs([...tabs, { id: newId, name: `Space ${tabs.length + 1}` }])
    setTabShapes({ ...tabShapes, [newId]: [] })
    setActiveTab(newId)
  }

  const handleShapeDragStart = (e: React.MouseEvent, shapeId: string) => {
    if (!isEditMode) return

    const container = containerRef
    if (!container) return

    const rect = container.getBoundingClientRect()
    const shape = (tabShapes[activeTab] || []).find((s) => s.id === shapeId)
    if (!shape) return

    const offsetX = e.clientX - rect.left - shape.x
    const offsetY = e.clientY - rect.top - shape.y

    setDraggedShapeId(shapeId)
    setDragOffset({ x: offsetX, y: offsetY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedShapeId || !containerRef) return

    const rect = containerRef.getBoundingClientRect()
    const newX = Math.max(0, e.clientX - rect.left - dragOffset.x)
    const newY = Math.max(0, e.clientY - rect.top - dragOffset.y)

    setTabShapes({
      ...tabShapes,
      [activeTab]: (tabShapes[activeTab] || []).map((shape) =>
        shape.id === draggedShapeId ? { ...shape, x: newX, y: newY } : shape,
      ),
    })
  }

  const handleMouseUp = () => {
    setDraggedShapeId(null)
  }

  const handleShapeDoubleClick = (shapeId: string, currentName: string) => {
    setEditingShapeId(shapeId)
    setEditingShapeName(currentName)
  }

  const handleSaveShapeName = () => {
    if (editingShapeId && editingShapeName.trim()) {
      setTabShapes({
        ...tabShapes,
        [activeTab]: (tabShapes[activeTab] || []).map((shape) =>
          shape.id === editingShapeId ? { ...shape, name: editingShapeName } : shape,
        ),
      })
    }
    setEditingShapeId(null)
    setEditingShapeName("")
  }

  const handleAddLayout = () => {
    const newShape: Shape = {
      id: `shape-${Date.now()}`,
      type: "rectangle",
      x: 10,
      y: 10,
      width: 150,
      height: 100,
      name: `Layout ${(tabShapes[activeTab]?.length || 0) + 1}`,
    }
    setTabShapes({
      ...tabShapes,
      [activeTab]: [...(tabShapes[activeTab] || []), newShape],
    })
  }

  const handleDeleteShape = (shapeId: string) => {
    setTabShapes({
      ...tabShapes,
      [activeTab]: (tabShapes[activeTab] || []).filter((shape) => shape.id !== shapeId),
    })
  }

  const handleSaveEdit = () => {
    setIsEditMode(false)
    setEditingTabId(null)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setEditingTabId(null)
    setEditingTabName("")
  }

  const currentShapes = tabShapes[activeTab] || []

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card w-full h-full max-w-full max-h-full rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-center p-4 border-b border-border relative">
          <h2 className="text-xl font-semibold">Space View</h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-4">
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
          {/* Scrollable tabs container */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-2 min-w-min">
              {tabs.map((tab) => (
                <div key={tab.id} className="flex items-center">
                  {isEditMode && editingTabId === tab.id ? (
                    <input
                      type="text"
                      value={editingTabName}
                      onChange={(e) => setEditingTabName(e.target.value)}
                      onBlur={handleSaveTabName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveTabName()
                        if (e.key === "Escape") {
                          setEditingTabId(null)
                          setEditingTabName("")
                        }
                      }}
                      autoFocus
                      className="px-3 py-1.5 rounded-md text-sm font-medium border border-primary bg-background text-foreground"
                    />
                  ) : (
                    <button
                      onClick={() => {
                        if (isEditMode) {
                          handleStartEdit(tab.id, tab.name)
                        } else {
                          setActiveTab(tab.id)
                        }
                      }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-background text-foreground hover:bg-muted"
                      }`}
                    >
                      {tab.name}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Persistent Edit Mode button */}
          <Button
            variant={isEditMode ? "default" : "outline"}
            size="sm"
            className="flex-shrink-0 bg-transparent"
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? "Edit Mode: ON" : "Edit Mode"}
          </Button>
        </div>

        {/* Content */}
        <div
          ref={setContainerRef}
          className="flex-1 overflow-auto p-4 bg-muted/10 relative"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {currentShapes.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              <p className="text-muted-foreground opacity-50">Fitur Space Layout sedang dalam Tahap Perkembangan</p>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {currentShapes.map((shape) => (
                <div
                  key={shape.id}
                  className={`absolute bg-primary/10 border-2 border-primary rounded-lg flex flex-col items-center justify-center group transition-colors p-3 ${
                    isEditMode
                      ? draggedShapeId === shape.id
                        ? "cursor-grabbing hover:bg-primary/20"
                        : "cursor-grab hover:bg-primary/20"
                      : "cursor-pointer hover:bg-primary/20"
                  }`}
                  style={{
                    left: `${shape.x}px`,
                    top: `${shape.y}px`,
                    width: `${shape.width}px`,
                    height: `${shape.height}px`,
                  }}
                  onMouseDown={(e) => isEditMode && handleShapeDragStart(e, shape.id)}
                  onDoubleClick={() => isEditMode && handleShapeDoubleClick(shape.id, shape.name)}
                >
                  {editingShapeId === shape.id ? (
                    <input
                      type="text"
                      value={editingShapeName}
                      onChange={(e) => setEditingShapeName(e.target.value)}
                      onBlur={handleSaveShapeName}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSaveShapeName()
                        if (e.key === "Escape") {
                          setEditingShapeId(null)
                          setEditingShapeName("")
                        }
                      }}
                      autoFocus
                      className="px-2 py-1 rounded text-xs font-medium border border-primary bg-background text-foreground text-center w-full"
                    />
                  ) : (
                    <p className="text-xs font-medium text-foreground text-center break-words">{shape.name}</p>
                  )}
                  {isEditMode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 h-6 w-6 p-0"
                      onClick={() => handleDeleteShape(shape.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {isEditMode && (
          <div className="border-t border-border bg-muted/30 p-4 flex items-center justify-between">
            {/* Left side buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleAddSpace}>
                <Plus className="w-4 h-4" />
                Tambah Space
              </Button>
              <Button variant="outline" size="sm" className="gap-2 bg-transparent" onClick={handleAddLayout}>
                <Plus className="w-4 h-4" />
                Tambah Layout
              </Button>
            </div>

            {/* Right side buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                Batal
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Simpan
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
