"use client"

import { useState, use } from "react"
import { notFound } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { AccessControlPanel } from "@/components/access-control-panel"
import { DocumentEditorPanel } from "@/components/document-editor-panel"
import { AuditLogPanel } from "@/components/audit-log-panel"
import { SecurityPanel } from "@/components/security-panel"
import { toast } from "@/hooks/use-toast"
import {
  initialDocuments,
  createAuditLogEntry,
  type Document,
  type DocumentStatus,
} from "@/lib/document-store"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function DocumentViewPage({ params }: PageProps) {
  const { id } = use(params)
  const initialDoc = initialDocuments.find((d) => d.id === id)

  if (!initialDoc) {
    notFound()
  }

  const [document, setDocument] = useState<Document>(initialDoc)
  const [content, setContent] = useState(document.content)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isApproving, setIsApproving] = useState<string | null>(null)

  const handleRequestAccess = async () => {
    setIsRequesting(true)
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Find a participant that hasn't requested yet and update their status
    const updatedParticipants = document.participants.map((p) => {
      if (p.status === "not-requested") {
        return { ...p, status: "pending" as const }
      }
      return p
    })

    const newEntry = createAuditLogEntry("Access requested by John Doe")

    setDocument({
      ...document,
      participants: updatedParticipants,
      auditLog: [newEntry, ...document.auditLog],
    })

    setIsRequesting(false)

    toast({
      title: "Access requested",
      description: "Waiting for participant approvals.",
    })
  }

  const handleApprove = async (participantId: string) => {
    const participant = document.participants.find((p) => p.id === participantId)
    if (!participant) return

    setIsApproving(participantId)
    
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    const updatedParticipants = document.participants.map((p) =>
      p.id === participantId ? { ...p, status: "approved" as const } : p
    )

    const newApprovals = document.currentApprovals + 1
    const isNowUnlocked = newApprovals >= document.requiredApprovals
    const newStatus: DocumentStatus = isNowUnlocked ? "unlocked" : "pending"

    const entries = [
      createAuditLogEntry(`Access approved by ${participant.name}`),
      ...(isNowUnlocked ? [createAuditLogEntry("Document unlocked")] : []),
    ]

    setDocument({
      ...document,
      participants: updatedParticipants,
      currentApprovals: newApprovals,
      status: newStatus,
      auditLog: [...entries, ...document.auditLog],
    })

    setIsApproving(null)

    if (isNowUnlocked) {
      toast({
        title: "Access granted",
        description: "Document has been unlocked. You now have full access.",
      })
    } else {
      const remaining = document.requiredApprovals - newApprovals
      toast({
        title: "Approval received",
        description: `Waiting for ${remaining} more approval${remaining > 1 ? "s" : ""}.`,
      })
    }
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    setDocument({
      ...document,
      content: newContent,
      lastUpdated: new Date(),
    })
  }

  const handleSave = async () => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300))
    
    toast({
      title: "Document updated",
      description: "Your changes have been saved.",
    })
  }

  return (
    <AppShell title="Document">
      <div className="space-y-4">
        {/* Security Panel */}
        <SecurityPanel document={document} />

        {/* 3-Column Layout */}
        <div className="grid gap-4 lg:grid-cols-[280px_1fr_280px]">
          {/* Left Panel - Access Control */}
          <AccessControlPanel
            document={document}
            onRequestAccess={handleRequestAccess}
            onApprove={handleApprove}
            isRequesting={isRequesting}
            isApproving={isApproving}
          />

          {/* Center Panel - Editor */}
          <DocumentEditorPanel
            document={document}
            content={content}
            onContentChange={handleContentChange}
            onSave={handleSave}
          />

          {/* Right Panel - Audit Log */}
          <AuditLogPanel entries={document.auditLog} />
        </div>
      </div>
    </AppShell>
  )
}
