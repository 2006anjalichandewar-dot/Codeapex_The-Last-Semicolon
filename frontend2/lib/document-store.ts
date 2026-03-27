export type DocumentStatus = "locked" | "pending" | "unlocked"

export type ParticipantStatus = "approved" | "pending" | "not-requested"

export interface Participant {
  id: string
  name: string
  email: string
  avatar?: string
  status: ParticipantStatus
}

export interface AuditLogEntry {
  id: string
  action: string
  timestamp: Date
  hash: string
  verified: boolean
  previousHash?: string | null
}

export interface Document {
  id: string
  title: string
  content: string
  status: DocumentStatus
  threshold: number
  requiredApprovals: number
  currentApprovals: number
  totalCollaborators: number
  participants: Participant[]
  auditLog: AuditLogEntry[]
  lastUpdated: Date
}

export function createAuditLogEntry(action: string): AuditLogEntry {
  return {
    id: `log-${Date.now()}`,
    action,
    timestamp: new Date(),
    hash: "demo-hash",
    verified: true,
  }
}
