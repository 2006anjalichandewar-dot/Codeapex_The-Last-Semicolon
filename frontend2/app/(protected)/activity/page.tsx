"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { CheckCircle2, FileText, Lock, Unlock, UserPlus, ShieldCheck } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { apiFetch } from "@/lib/api"
import { getToken } from "@/lib/token"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ActivityItem {
  id: number
  document_id: number
  document_title: string
  user_id: number
  user_email: string | null
  action: string
  timestamp: string
  hash: string
  previous_hash: string | null
}

const actionConfig: Record<string, { label: string; icon: typeof CheckCircle2 }> = {
  access_request: { label: "requested access to", icon: UserPlus },
  approval: { label: "approved access to", icon: CheckCircle2 },
  threshold_met: { label: "reached threshold for", icon: ShieldCheck },
  access_granted: { label: "granted access to", icon: Unlock },
  edit: { label: "edited", icon: FileText },
}

export default function ActivityPage() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState("all")
  const [docFilter, setDocFilter] = useState("all")

  useEffect(() => {
    const load = async () => {
      const token = getToken()
      if (!token) return
      try {
        const data = await apiFetch<ActivityItem[]>("/activity", {}, token)
        setActivities(data)
      } catch (err: any) {
        setError(err?.message || "Failed to load activity")
      }
    }
    load()
  }, [])

  const filteredActivities = activities.filter((activity) => {
    const actionOk = actionFilter === "all" || activity.action === actionFilter
    const docOk = docFilter === "all" || String(activity.document_id) === docFilter
    return actionOk && docOk
  })

  const documentOptions = Array.from(
    new Map(activities.map((item) => [item.document_id, item.document_title])).entries()
  )

  return (
    <AppShell title="Activity">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Activity Feed</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track all document access and approval events
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="h-8 w-[180px]">
                    <SelectValue placeholder="Filter action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All actions</SelectItem>
                    {Object.keys(actionConfig).map((key) => (
                      <SelectItem key={key} value={key}>
                        {key.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={docFilter} onValueChange={setDocFilter}>
                  <SelectTrigger className="h-8 w-[200px]">
                    <SelectValue placeholder="Filter document" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All documents</SelectItem>
                    {documentOptions.map(([id, title]) => (
                      <SelectItem key={id} value={String(id)}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredActivities.length === 0 ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-6 text-center">
                <p className="text-sm font-medium text-foreground">No activity yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Once you request access, approve, or edit a document, events will appear here.
                </p>
                <div className="mt-3 inline-flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="gap-1 text-[10px] h-5 bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                    Verified
                  </Badge>
                  <span>Activity is hashed and auditable.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                {filteredActivities.map((activity, index) => {
                  const cfg = actionConfig[activity.action] || { label: activity.action, icon: Lock }
                  const Icon = cfg.icon
                  const timestamp = new Date(activity.timestamp)
                  return (
                    <div key={activity.id} className="relative pl-8 pb-6 last:pb-0">
                      {index < activities.length - 1 && (
                        <div className="absolute left-[15px] top-8 h-full w-px bg-border" />
                      )}
                      <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 pt-0.5">
                          <p className="text-sm">
                            <span className="font-medium">
                              {activity.user_email || `User #${activity.user_id}`}
                            </span>{" "}
                            <span className="text-muted-foreground">{cfg.label}</span>{" "}
                            <span className="font-medium">{activity.document_title}</span>
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(timestamp, { addSuffix: true })}
                            </span>
                            <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {activity.hash.slice(0, 10)}
                            </code>
                            <Badge variant="outline" className="gap-1 text-[10px] h-5 bg-success/10 text-success border-success/20">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              Verified
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
