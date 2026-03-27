"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/hooks/use-toast"
import type { Document } from "@/lib/document-store"
import { createAuditLogEntry } from "@/lib/document-store"

// Available participants to add
const AVAILABLE_PARTICIPANTS = [
  { id: "p1", name: "Alice Chen", email: "alice@company.com" },
  { id: "p2", name: "Bob Smith", email: "bob@company.com" },
  { id: "p3", name: "Carol White", email: "carol@company.com" },
  { id: "p4", name: "David Lee", email: "david@company.com" },
  { id: "p5", name: "Emma Wilson", email: "emma@company.com" },
  { id: "p6", name: "Frank Miller", email: "frank@company.com" },
]

interface CreateDocumentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateDocument: (document: Document) => void
}

export function CreateDocumentModal({
  open,
  onOpenChange,
  onCreateDocument,
}: CreateDocumentModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [selectedParticipants, setSelectedParticipants] = useState<typeof AVAILABLE_PARTICIPANTS>([])
  const [threshold, setThreshold] = useState("2")
  const [isCreating, setIsCreating] = useState(false)
  const [errors, setErrors] = useState<{ title?: string; participants?: string }>({})

  const handleAddParticipant = (participantId: string) => {
    const participant = AVAILABLE_PARTICIPANTS.find((p) => p.id === participantId)
    if (participant && !selectedParticipants.find((p) => p.id === participantId)) {
      setSelectedParticipants([...selectedParticipants, participant])
      setErrors((prev) => ({ ...prev, participants: undefined }))
    }
  }

  const handleRemoveParticipant = (participantId: string) => {
    setSelectedParticipants(selectedParticipants.filter((p) => p.id !== participantId))
  }

  const availableToAdd = AVAILABLE_PARTICIPANTS.filter(
    (p) => !selectedParticipants.find((sp) => sp.id === p.id)
  )

  const maxThreshold = selectedParticipants.length || 1

  const handleCreate = async () => {
    const newErrors: typeof errors = {}

    if (!title.trim()) {
      newErrors.title = "Title is required"
    }

    if (selectedParticipants.length === 0) {
      newErrors.participants = "Add at least one participant"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setIsCreating(true)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 600))

    const newDoc: Document = {
      id: `doc-${Date.now()}`,
      title: title.trim(),
      content: "",
      status: "locked",
      threshold: parseInt(threshold),
      requiredApprovals: parseInt(threshold),
      currentApprovals: 0,
      participants: selectedParticipants.map((p) => ({
        ...p,
        status: "not-requested" as const,
      })),
      auditLog: [createAuditLogEntry("Document created")],
      lastUpdated: new Date(),
    }

    onCreateDocument(newDoc)
    setIsCreating(false)
    onOpenChange(false)

    // Reset form
    setTitle("")
    setSelectedParticipants([])
    setThreshold("2")
    setErrors({})

    toast({
      title: "Document created",
      description: `"${newDoc.title}" has been created successfully.`,
    })

    // Navigate to the new document
    router.push(`/documents/${newDoc.id}`)
  }

  const handleClose = () => {
    if (!isCreating) {
      onOpenChange(false)
      setTitle("")
      setSelectedParticipants([])
      setThreshold("2")
      setErrors({})
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create new document</DialogTitle>
          <DialogDescription>
            Set up a new secure document with threshold access control.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                setErrors((prev) => ({ ...prev, title: undefined }))
              }}
              placeholder="Enter document title"
              disabled={isCreating}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title}</p>
            )}
          </div>

          {/* Participants */}
          <div className="space-y-2">
            <Label>Participants</Label>
            <Select onValueChange={handleAddParticipant} disabled={isCreating || availableToAdd.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder="Add participant" />
              </SelectTrigger>
              <SelectContent>
                {availableToAdd.map((participant) => (
                  <SelectItem key={participant.id} value={participant.id}>
                    {participant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedParticipants.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {selectedParticipants.map((participant) => (
                  <Badge
                    key={participant.id}
                    variant="secondary"
                    className="gap-1 pr-1"
                  >
                    {participant.name}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => handleRemoveParticipant(participant.id)}
                      disabled={isCreating}
                    >
                      <X className="h-3 w-3" />
                      <span className="sr-only">Remove {participant.name}</span>
                    </Button>
                  </Badge>
                ))}
              </div>
            )}

            {errors.participants && (
              <p className="text-sm text-destructive">{errors.participants}</p>
            )}
          </div>

          {/* Threshold */}
          <div className="space-y-2">
            <Label htmlFor="threshold">Approval threshold</Label>
            <Select
              value={threshold}
              onValueChange={setThreshold}
              disabled={isCreating || selectedParticipants.length === 0}
            >
              <SelectTrigger id="threshold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: maxThreshold }, (_, i) => i + 1).map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    {num} approval{num > 1 ? "s" : ""} required
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Document will unlock when {threshold} participant{parseInt(threshold) > 1 ? "s" : ""} approve access.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={isCreating} className="gap-2">
            {isCreating ? (
              <>
                <Spinner className="h-4 w-4" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Create document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
