export interface User {
  id: string
  email: string
  displayName: string
  role: 'admin' | 'user'
  companyId: string
  departmentId?: string
  linkedinId?: string
  createdAt: string
}

export interface Company {
  id: string
  name: string
  domain: string
  multiEntity: boolean
  createdAt: string
}

export interface Department {
  id: string
  name: string
  companyId: string
  entityId?: string
}

export interface Software {
  id: string
  name: string
  version?: string
  category: string
  description?: string
  externalRefId?: string
  companyId: string
  departmentId?: string
  status: 'active' | 'inactive' | 'deprecated'
  owner_department?: string
  annual_cost?: number
  license_count?: number
  contract_end_date?: string
  notice_period_days?: number
  createdAt: string
  updatedAt: string
}

export interface Contract {
  id: string
  softwareId: string
  costAmount: number
  currency: string
  billingPeriod: 'monthly' | 'yearly' | 'one-time'
  licenseCount: number
  startDate: string
  endDate?: string
  noticeDays?: number
  renewalDate?: string
  createdAt: string
}

export interface Review {
  id: string
  userId: string
  softwareId: string
  rating: number
  comment?: string
  createdAt: string
  user?: User
}

export interface SoftwareRequest {
  id: string
  softwareName: string
  externalRefId?: string
  description: string
  urgency: 'immediate' | 'short_term' | 'long_term'
  estimatedBudget?: number
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected'
  requesterId: string
  departmentId?: string
  companyId: string
  voteCount: number
  createdAt: string
  updatedAt: string
  requester?: User
  votes?: Vote[]
}

export interface Vote {
  id: string
  requestId: string
  voterId: string
  createdAt: string
  voter?: User
}

export interface Notification {
  id: string
  type: 'contract_expiry' | 'new_request' | 'request_approved' | 'request_rejected' | 'system'
  title: string
  message: string
  targetUserId: string
  payload?: any
  readAt?: string
  createdAt: string
}

export interface Usage {
  id: string
  userId: string
  softwareId: string
  status: 'active' | 'inactive'
  lastUsed?: string
  createdAt: string
}

export interface DashboardStats {
  totalSoftware: number
  totalCost: number
  expiringContracts: number
  pendingRequests: number
  completionRate: number
  activeUsers: number
}