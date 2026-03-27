"use client"

import { useState, useMemo } from "react"
import { Plus, FileText } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Button } from "@/components/ui/button"
import { DocumentCard } from "@/components/document-card"
import { CreateDocumentModal } from "@/components/create-document-modal"
import { SearchFilter } from "@/components/search-filter"
import { EmptyState } from "@/components/empty-state"
import { initialDocuments, type Document, type DocumentStatus } from "@/lib/document-store"

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>(initialDocuments)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilters, setStatusFilters] = useState<DocumentStatus[]>(["locked", "pending", "unlocked"])

  const handleCreateDocument = (newDoc: Document) => {
    setDocuments([newDoc, ...documents])
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
