"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import { AppShell } from "@/components/app-shell"
import { AccessControlPanel } from "@/components/access-control-panel"
import { DocumentEditorPanel } from "@/components/document-editor-panel"
import { AuditLogPanel } from "@/components/audit-log-panel"
import { SecurityPanel } from "@/components/security-panel"
import { toast } from "@/hooks/use-toast"
import { apiFetch, API_URL } from "@/lib/api"
import { getToken } from "@/lib/token"
import { getDocMeta } from "@/lib/doc-meta"
import type { Document, DocumentStatus, Participant, AuditLogEntry } from "@/lib/document-store"

interface ApiDocument {
  id: number
  title: string
  content: string
  owner_id: number
  is_locked: boolean
  created_at: string
}

interface AccessRequestItem {
  id: number
  document_id: number
  requested_by: number
  status: string
  approvals_count: number
}

interface AuditLogItem {
  id: number
  document_id: number
  user_id: number
  action: string
  timestamp: string
  hash: string
  previous_hash: string | null
}

function parseJwt(token: string): { sub?: string } {
  try {
    const payload = token.split(".")[1]
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
    return JSON.parse(json)
  } catch {
    return {}
  }
}

function buildParticipants(
  ownerId: number,
  pendingRequest: AccessRequestItem | null,
  approvals: number,
  currentUserId: string | null,
  approvedByMe: boolean
): Participant[] {
  const participants: Participant[] = []

  participants.push({
    id: `owner-${ownerId}`,
    name: `Owner #${ownerId}`,
    email: `owner${ownerId}@local`,
    status: "approved",
  })

  if (pendingRequest) {
    participants.push({
      id: `req-${pendingRequest.requested_by}`,
      name: `Requester #${pendingRequest.requested_by}`,
      email: `user${pendingRequest.requested_by}@local`,
      status: "pending",
    })
  }

  if (currentUserId && pendingRequest && String(pendingRequest.requested_by) !== currentUserId) {
    participants.push({
      id: currentUserId,
      name: "You",
      email: "you@local",
      status: approvedByMe ? "approved" : "pending",
    })
  }

  return participants
}

export default function DocumentViewPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const token = useMemo(() => getToken(), [])
  const jwt = token ? parseJwt(token) : {}
  const currentUserId = jwt.sub || null

  const [document, setDocument] = useState<Document | null>(null)
  const [content, setContent] = useState("")
  const [isRequesting, setIsRequesting] = useState(false)
  const [isApproving, setIsApproving] = useState<string | null>(null)
  const [pendingRequest, setPendingRequest] = useState<AccessRequestItem | null>(null)
  const [auditEntries, setAuditEntries] = useState<AuditLogEntry[]>([])
  const [approvedByMe, setApprovedByMe] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)

  const mapDocument = (apiDoc: ApiDocument, req: AccessRequestItem | null): Document => {
    const approvals = req?.approvals_count || 0
    const meta = getDocMeta(String(apiDoc.id))
    const requiredApprovals = meta?.thresholdRequired ?? 2
    const totalCollaborators = meta?.totalCollaborators ?? Math.max(requiredApprovals, 2)
    const status: DocumentStatus = !apiDoc.is_locked
      ? "unlocked"
      : req
        ? "pending"
        : "locked"

    return {
      id: String(apiDoc.id),
      title: apiDoc.title,
      content: apiDoc.content || "",
      status,
      threshold: requiredApprovals,
      requiredApprovals,
      currentApprovals: approvals,
      totalCollaborators,
      participants: buildParticipants(apiDoc.owner_id, req, approvals, currentUserId, approvedByMe),
      auditLog: auditEntries,
      lastUpdated: new Date(apiDoc.created_at),
    }
  }

  const loadDocument = async () => {
    if (!token) return
    const docs = await apiFetch<ApiDocument[]>("/documents/", {}, token)
    const doc = docs.find((d) => String(d.id) === id)
    if (!doc) {
      router.push("/documents")
      return
    }
    const reqs = await apiFetch<AccessRequestItem[]>(`/documents/${doc.id}/access-requests?status=pending`, {}, token)
    const req = reqs[0] || null
    setPendingRequest(req)
    const mapped = mapDocument(doc, req)
    setDocument(mapped)
    setContent(doc.content || "")
  }

  const loadAudit = async () => {
    if (!token) return
    const data = await apiFetch<AuditLogItem[]>(`/document-history/${id}`, {}, token)
    const mapped: AuditLogEntry[] = data.map((entry) => ({
      id: String(entry.id),
      action: entry.action,
      timestamp: new Date(entry.timestamp),
      hash: entry.hash,
      verified: true,
      previousHash: entry.previous_hash,
    }))
    setAuditEntries(mapped)
  }

  useEffect(() => {
    if (!token) {
      router.push("/login")
      return
    }
    loadDocument()
    loadAudit()
  }, [])

  useEffect(() => {
    if (!token) return
    const wsUrl = API_URL.replace("http", "ws") + `/ws/${id}?token=${token}`
    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg?.content !== undefined) {
          setContent(msg.content)
        }
      } catch {
        // ignore
      }
    }

    return () => {
      ws.close()
    }
  }, [id, token])

  useEffect(() => {
    if (!wsRef.current) return
    const timeout = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({ content }))
    }, 400)
    return () => clearTimeout(timeout)
  }, [content])

  const handleRequestAccess = async () => {
    if (!token) return
    setIsRequesting(true)
    try {
      await apiFetch("/request-access", {
        method: "POST",
        body: JSON.stringify({ document_id: Number(id) }),
      }, token)
      await loadDocument()
      await loadAudit()
      toast({
        title: "Access requested",
        description: "Waiting for participant approvals.",
      })
    } catch (err: any) {
      toast({
        title: "Request failed",
        description: err?.message || "Unable to request access.",
      })
    } finally {
      setIsRequesting(false)
    }
  }

  const handleApprove = async () => {
    if (!token || !pendingRequest) return
    setIsApproving(currentUserId)
    await apiFetch("/approve-request", {
      method: "POST",
      body: JSON.stringify({ request_id: pendingRequest.id }),
    }, token)
    setApprovedByMe(true)
    await loadDocument()
    await loadAudit()
    setIsApproving(null)
    toast({
      title: "Approval submitted",
      description: "Your approval has been recorded.",
    })
  }

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    if (document) {
      setDocument({
        ...document,
        content: newContent,
        lastUpdated: new Date(),
      })
    }
  }

  const handleSave = async () => {
    toast({
      title: "Document updated",
      description: "Changes synced through realtime channel.",
    })
  }

  if (!document) {
    return (
      <AppShell title="Document">
        <div className="text-sm text-muted-foreground">Loading document...</div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Document">
      <div className="space-y-4">
        <SecurityPanel document={document} />

        <div className="grid gap-4 lg:grid-cols-[280px_1fr_280px]">
          <AccessControlPanel
            document={document}
            onRequestAccess={handleRequestAccess}
            onApprove={() => handleApprove()}
            currentUserId={currentUserId || undefined}
            isRequesting={isRequesting}
            isApproving={isApproving}
            requestPending={pendingRequest?.status === "pending"}
          />

          <DocumentEditorPanel
            document={document}
            content={content}
            onContentChange={handleContentChange}
            onSave={handleSave}
          />

          <AuditLogPanel entries={auditEntries} />
        </div>
      </div>
    </AppShell>
  )
}
