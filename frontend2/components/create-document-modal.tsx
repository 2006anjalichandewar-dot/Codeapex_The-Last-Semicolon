"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

interface CreateDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateDocument: (payload: {
    title: string
    content: string
    collaborators: string[]
    threshold: number
  }) => Promise<void>
}

export function CreateDocumentModal({
  open,
  onOpenChange,
  onCreateDocument,
}: CreateDocumentModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [collaboratorInput, setCollaboratorInput] = useState("")
  const [collaborators, setCollaborators] = useState<string[]>([])
  const [threshold, setThreshold] = useState(1)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState("")

  const collaboratorCount = collaborators.length

  const handleAddCollaborator = () => {
    const value = collaboratorInput.trim()
    if (!value) return
    if (collaborators.includes(value)) {
      setError("Collaborator already added")
      return
    }
    setCollaborators((prev) => [...prev, value])
    setCollaboratorInput("")
  }

  const handleRemoveCollaborator = (value: string) => {
    setCollaborators((prev) => prev.filter((item) => item !== value))
  }

  const handleCreate = async () => {
    setError("")
    if (!title.trim()) {
      setError("Title is required")
      return
    }
    if (collaboratorCount < 1) {
      setError("Add at least one collaborator")
      return
    }
    if (threshold < 1) {
      setError("Threshold must be at least 1")
      return
    }
    if (threshold > collaboratorCount) {
      setError("Threshold must be less than or equal to collaborators")
      return
    }

    setIsCreating(true)
    try {
      await onCreateDocument({
        title: title.trim(),
        content,
        collaborators,
        threshold,
      })
      onOpenChange(false)
      setTitle("")
      setContent("")
      setCollaborators([])
      setCollaboratorInput("")
      setThreshold(1)
    } catch (err: any) {
      setError(err?.message || "Failed to create document")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new document</DialogTitle>
          <DialogDescription>
            Create a secure document (locked by default).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter document title"
              disabled={isCreating}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Optional initial content"
              disabled={isCreating}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="collaborators">Collaborators</Label>
            <div className="flex gap-2">
              <Input
                id="collaborators"
                value={collaboratorInput}
                onChange={(e) => setCollaboratorInput(e.target.value)}
                placeholder="Email or user ID"
                disabled={isCreating}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleAddCollaborator()
                  }
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleAddCollaborator}
                disabled={isCreating}
              >
                Add
              </Button>
            </div>
            {collaboratorCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {collaborators.map((value) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs"
                  >
                    {value}
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleRemoveCollaborator(value)}
                      aria-label={`Remove ${value}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add collaborators by email or numeric user ID. For live approvals, use user IDs.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="threshold">Approval Threshold</Label>
            <Input
              id="threshold"
              type="number"
              min={1}
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              disabled={isCreating}
            />
            <p className="text-xs text-muted-foreground">
              Threshold: {threshold} / {collaboratorCount} approvals required
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
            {isCreating ? (
              <>
                <Spinner className="h-4 w-4" />
                Creating...
              </>
            ) : (
              "Create document"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
