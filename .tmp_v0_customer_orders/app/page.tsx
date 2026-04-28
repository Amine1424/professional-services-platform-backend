"use client"

import { useState } from "react"
import { RequestList } from "@/components/customer-orders/request-list"
import { RequestDetail } from "@/components/customer-orders/request-detail"
import { mockRequests, type ServiceRequest } from "@/lib/mock-data"

// Simulating URL params - in real implementation these would come from useSearchParams
const initialRequestId = "323fb439-382a-4eb9-9ecc-6c62400c43c0"
const initialTab = "all"

export default function CustomerOrdersPage() {
  const [selectedRequestId, setSelectedRequestId] = useState<string>(initialRequestId)
  const [activeTab, setActiveTab] = useState<string>(initialTab)

  const selectedRequest = mockRequests.find(r => r.id === selectedRequestId) || mockRequests[0]

  const filteredRequests = activeTab === "all" 
    ? mockRequests 
    : mockRequests.filter(r => {
        if (activeTab === "pending") return r.status === "pending_quote" || r.status === "quote_received"
        if (activeTab === "active") return r.status === "in_progress"
        if (activeTab === "completed") return r.status === "completed"
        if (activeTab === "cancelled") return r.status === "cancelled"
        return true
      })

  return (
    <div className="flex h-screen bg-background">
      {/* Request List Panel */}
      <aside className="w-[380px] border-r border-border flex flex-col bg-card">
        <RequestList
          requests={filteredRequests}
          selectedRequestId={selectedRequestId}
          onSelectRequest={setSelectedRequestId}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      </aside>

      {/* Request Detail Panel */}
      <main className="flex-1 overflow-auto">
        <RequestDetail request={selectedRequest} />
      </main>
    </div>
  )
}
