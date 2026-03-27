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
}

export interface Document {
  id: string
  title: string
  content: string
  status: DocumentStatus
  threshold: number
  requiredApprovals: number
  currentApprovals: number
  participants: Participant[]
  auditLog: AuditLogEntry[]
  lastUpdated: Date
}

// Generate a mock hash
function generateHash(): string {
  return '0x' + Array.from({ length: 8 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

// Initial mock documents
export const initialDocuments: Document[] = [
  {
    id: "doc-1",
    title: "Q4 Financial Report",
    content: "This document contains sensitive financial information for Q4 2024...",
    status: "locked",
    threshold: 3,
    requiredApprovals: 3,
    currentApprovals: 1,
    participants: [
      { id: "p1", name: "Alice Chen", email: "alice@company.com", status: "approved" },
      { id: "p2", name: "Bob Smith", email: "bob@company.com", status: "pending" },
      { id: "p3", name: "Carol White", email: "carol@company.com", status: "not-requested" },
    ],
    auditLog: [
      { id: "log-1", action: "Document created by John Doe", timestamp: new Date(Date.now() - 86400000 * 2), hash: generateHash(), verified: true },
      { id: "log-2", action: "Access requested by Alice Chen", timestamp: new Date(Date.now() - 86400000), hash: generateHash(), verified: true },
      { id: "log-3", action: "Access approved by Alice Chen", timestamp: new Date(Date.now() - 3600000), hash: generateHash(), verified: true },
    ],
    lastUpdated: new Date(Date.now() - 3600000),
  },
  {
    id: "doc-2",
    title: "Project Roadmap 2025",
    content: "Strategic initiatives and milestones for the upcoming fiscal year...",
    status: "pending",
    threshold: 2,
    requiredApprovals: 2,
    currentApprovals: 1,
    participants: [
      { id: "p1", name: "David Lee", email: "david@company.com", status: "approved" },
      { id: "p2", name: "Emma Wilson", email: "emma@company.com", status: "pending" },
    ],
    auditLog: [
      { id: "log-1", action: "Document created by John Doe", timestamp: new Date(Date.now() - 86400000 * 5), hash: generateHash(), verified: true },
      { id: "log-2", action: "Access approved by David Lee", timestamp: new Date(Date.now() - 86400000), hash: generateHash(), verified: true },
    ],
    lastUpdated: new Date(Date.now() - 86400000),
  },
  {
    id: "doc-3",
    title: "Employee Handbook v3",
    content: "Updated policies and procedures for all employees...",
    status: "unlocked",
    threshold: 2,
    requiredApprovals: 2,
    currentApprovals: 2,
    participants: [
      { id: "p1", name: "Frank Miller", email: "frank@company.com", status: "approved" },
      { id: "p2", name: "Grace Kim", email: "grace@company.com", status: "approved" },
    ],
    auditLog: [
      { id: "log-1", action: "Document created by John Doe", timestamp: new Date(Date.now() - 86400000 * 10), hash: generateHash(), verified: true },
      { id: "log-2", action: "Access approved by Frank Miller", timestamp: new Date(Date.now() - 86400000 * 3), hash: generateHash(), verified: true },
      { id: "log-3", action: "Access approved by Grace Kim", timestamp: new Date(Date.now() - 86400000 * 2), hash: generateHash(), verified: true },
      { id: "log-4", action: "Document unlocked", timestamp: new Date(Date.now() - 86400000 * 2), hash: generateHash(), verified: true },
    ],
    lastUpdated: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: "doc-4",
    title: "Security Audit Results",
    content: "Comprehensive security assessment findings and recommendations...",
    status: "locked",
    threshold: 3,
    requiredApprovals: 3,
    currentApprovals: 0,
    participants: [
      { id: "p1", name: "Henry Brown", email: "henry@company.com", status: "not-requested" },
      { id: "p2", name: "Ivy Chen", email: "ivy@company.com", status: "not-requested" },
      { id: "p3", name: "Jack Davis", email: "jack@company.com", status: "not-requested" },
    ],
    auditLog: [
      { id: "log-1", action: "Document created by John Doe", timestamp: new Date(Date.now() - 3600000), hash: generateHash(), verified: true },
    ],
    lastUpdated: new Date(Date.now() - 3600000),
  },
]

// Helper to generate new audit log entry
export function createAuditLogEntry(action: string): AuditLogEntry {
  return {
    id: `log-${Date.now()}`,
    action,
    timestamp: new Date(),
    hash: generateHash(),
    verified: true,
  }
}
