"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus, FileText } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { DocumentCard } from "@/components/document-card"
import { CreateDocumentModal } from "@/components/create-document-modal"
import { SearchFilter } from "@/components/search-filter"
import { EmptyState } from "@/components/empty-state"
import { toast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/token"
import { getDocMeta, setDocMeta } from "@/lib/doc-meta"
import { type Document, type DocumentStatus, type Participant } from "@/lib/document-store"

interface ApiDocument {
  id: number
  title: string
  content: string
  owner_id: number
  is_locked: boolean
  created_at: string
}

function mapDocument(api: ApiDocument): Document {
  const meta = getDocMeta(String(api.id))
  const requiredApprovals = meta?.thresholdRequired ?? 2
  const totalCollaborators = meta?.totalCollaborators ?? Math.max(requiredApprovals, 2)
  const status: DocumentStatus = api.is_locked ? "locked" : "unlocked"
  const owner: Participant = {
    id: `owner-${api.owner_id}`,
    name: `Owner #${api.owner_id}`,
    email: `owner${api.owner_id}@local`,
    status: "approved",
  }
  return {
    id: String(api.id),
    title: api.title,
    content: api.content || "",
    status,
    threshold: requiredApprovals,
    requiredApprovals,
    currentApprovals: 0,
    totalCollaborators,
    participants: [owner],
    auditLog: [],
    lastUpdated: new Date(api.created_at),
  }
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilters, setStatusFilters] = useState<DocumentStatus[]>(["locked", "pending", "unlocked"])
  const [error, setError] = useState<string | null>(null)

  const loadDocuments = async () => {
    setError(null)
    const token = getToken()
    if (!token) return
    try {
      const data = await apiFetch<ApiDocument[]>("/documents/", {}, token)
      setDocuments(data.map(mapDocument))
    } catch (err: any) {
      setError(err.message || "Failed to load documents")
    }
  }

  useEffect(() => {
    loadDocuments()
  }, [])

  const handleCreateDocument = async (payload: {
    title: string
    content: string
    collaborators: string[]
    threshold: number
  }) => {
    const token = getToken()
    if (!token) {
      throw new Error("Session expired. Please sign in again.")
    }
    try {
      const created = await apiFetch<ApiDocument>("/documents/", {
        method: "POST",
        body: JSON.stringify({ title: payload.title, content: payload.content }),
      }, token)
      const numericCollaborators = payload.collaborators
        .map((value) => Number(value))
        .filter((value) => Number.isFinite(value) && !Number.isNaN(value))
      const skipped = payload.collaborators.length - numericCollaborators.length

      for (const collaboratorId of numericCollaborators) {
        await apiFetch(`/documents/${created.id}/collaborators`, {
          method: "POST",
          body: JSON.stringify({ user_id: collaboratorId, role: "editor" }),
        }, token)
      }

      setDocMeta(String(created.id), {
        thresholdRequired: payload.threshold,
        totalCollaborators: payload.collaborators.length,
      })
      if (skipped > 0) {
        toast({
          title: "Some collaborators not linked",
          description: "Only numeric user IDs can be linked for live approvals.",
        })
      }
      await loadDocuments()
    } catch (err: any) {
      toast({
        title: "Failed to create document",
        description: err?.message || "Please check the API and try again.",
      })
      throw err
    }
  }

  const handleStatusFilterChange = (status: DocumentStatus) => {
    setStatusFilters((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status]
    )
  }

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = statusFilters.includes(doc.status)
      return matchesSearch && matchesStatus
    })
  }, [documents, searchQuery, statusFilters])

  const isEmpty = documents.length === 0
  const noResults = !isEmpty && filteredDocuments.length === 0

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Documents</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Secure, threshold-controlled collaboration
            </p>
            {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </div>

        {/* Search & Filter */}
        {!isEmpty && (
          <SearchFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilters={statusFilters}
            onStatusFilterChange={handleStatusFilterChange}
          />
        )}

        {/* Empty State */}
        {isEmpty && (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Create your first secure document to get started with threshold-based access control."
            action={
              <Button onClick={() => setIsModalOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create document
              </Button>
            }
          />
        )}

        {/* No Results */}
        {noResults && (
          <EmptyState
            icon={FileText}
            title="No documents found"
            description="Try adjusting your search query or filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilters(["locked", "pending", "unlocked"])
                }}
              >
                Clear filters
              </Button>
            }
          />
        )}

        {/* Document Grid */}
        {!isEmpty && !noResults && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((doc, index) => (
              <DocumentCard key={doc.id} document={doc} index={index} />
            ))}
          </div>
        )}
      </div>

      {/* Create Document Modal */}
      <CreateDocumentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onCreateDocument={handleCreateDocument}
      />
    </AppShell>
  )
}
