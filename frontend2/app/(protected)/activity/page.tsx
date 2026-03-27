"use client"

import { formatDistanceToNow } from "date-fns"
import { CheckCircle2, FileText, Lock, Unlock, UserPlus } from "lucide-react"
import { AppShell } from "@/components/app-shell"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// Mock activity data
const activities = [
  {
    id: "1",
    type: "approval",
    icon: CheckCircle2,
    user: { name: "Alice Chen", avatar: "", initials: "AC" },
    action: "approved access to",
    document: "Q4 Financial Report",
    timestamp: new Date(Date.now() - 3600000),
    hash: "0x8f2a91c3",
  },
  {
    id: "2",
    type: "unlock",
    icon: Unlock,
    user: { name: "System", avatar: "", initials: "SY" },
    action: "unlocked",
    document: "Employee Handbook v3",
    timestamp: new Date(Date.now() - 86400000 * 2),
    hash: "0x3b7d42e1",
  },
  {
    id: "3",
    type: "request",
    icon: UserPlus,
    user: { name: "Bob Smith", avatar: "", initials: "BS" },
    action: "requested access to",
    document: "Q4 Financial Report",
    timestamp: new Date(Date.now() - 86400000),
    hash: "0x5c9e8f72",
  },
  {
    id: "4",
    type: "create",
    icon: FileText,
    user: { name: "John Doe", avatar: "", initials: "JD" },
    action: "created",
    document: "Security Audit Results",
    timestamp: new Date(Date.now() - 3600000),
    hash: "0x1a4b6c8d",
  },
  {
    id: "5",
    type: "lock",
    icon: Lock,
    user: { name: "System", avatar: "", initials: "SY" },
    action: "locked",
    document: "Project Roadmap 2025",
    timestamp: new Date(Date.now() - 86400000 * 5),
    hash: "0x9e7f2d3c",
  },
  {
    id: "6",
    type: "approval",
    icon: CheckCircle2,
    user: { name: "David Lee", avatar: "", initials: "DL" },
    action: "approved access to",
    document: "Project Roadmap 2025",
    timestamp: new Date(Date.now() - 86400000),
    hash: "0x4d6a8b2e",
  },
]

export default function ActivityPage() {
  return (
    <AppShell title="Activity">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Activity Feed</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track all document access and approval events
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {activities.map((activity, index) => {
                const Icon = activity.icon
                return (
                  <div
                    key={activity.id}
                    className="relative pl-8 pb-6 last:pb-0"
                  >
                    {/* Timeline line */}
                    {index < activities.length - 1 && (
                      <div className="absolute left-[15px] top-8 h-full w-px bg-border" />
                    )}
                    {/* Timeline icon */}
                    <div className="absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>

                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
                            <AvatarFallback className="bg-muted text-muted-foreground text-[8px]">
                              {activity.user.initials}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-sm">
                            <span className="font-medium">{activity.user.name}</span>
                            {" "}
                            <span className="text-muted-foreground">{activity.action}</span>
                            {" "}
                            <span className="font-medium">{activity.document}</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                          </span>
                          <code className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {activity.hash}
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
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
