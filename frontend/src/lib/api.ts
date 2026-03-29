import axios from 'axios'

const API_BASE = '/api/v1'

export const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)

// ─── Types ────────────────────────────────────────────────────────────────────

export type Plan = 'free' | 'pro'

export interface User {
  id: string
  email: string
  name: string
  is_active: boolean
  plan: Plan
  onboarded: boolean
  created_at: string
}

export interface Project {
  id: string
  name: string
  key: string
  description: string | null
  owner_id: string
  created_at: string
  issue_count: number
}

export type IssueStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'done'
export type IssuePriority = 'low' | 'medium' | 'high' | 'urgent'
export type IssueType = 'task' | 'bug' | 'story' | 'feature'

export interface Issue {
  id: string
  project_id: string
  number: number
  title: string
  description: string | null
  status: IssueStatus
  priority: IssuePriority
  type: IssueType
  order: number
  reporter_id: string
  assignee_id: string | null
  assignee: { id: string; name: string; email: string } | null
  comment_count: number
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  issue_id: string
  author_id: string
  content: string
  author: { id: string; name: string; email: string }
  created_at: string
  updated_at: string
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    api.post<{ access_token: string; token_type: string; user: User }>('/auth/register', data),

  login: (email: string, password: string) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post<{ access_token: string; token_type: string; user: User }>('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },

  me: () => api.get<User>('/users/me'),

  updateMe: (data: Partial<{ name: string; email: string; onboarded: boolean }>) =>
    api.patch<User>('/users/me', data),
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export const projectsApi = {
  list: () => api.get<Project[]>('/projects'),
  get: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (data: { name: string; key: string; description?: string }) =>
    api.post<Project>('/projects', data),
  update: (id: string, data: { name?: string; description?: string }) =>
    api.patch<Project>(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
}

// ─── Issues ───────────────────────────────────────────────────────────────────

export const issuesApi = {
  list: (projectId: string) => api.get<Issue[]>(`/projects/${projectId}/issues`),
  get: (projectId: string, issueId: string) =>
    api.get<Issue>(`/projects/${projectId}/issues/${issueId}`),
  create: (
    projectId: string,
    data: {
      title: string
      description?: string
      status?: IssueStatus
      priority?: IssuePriority
      type?: IssueType
      assignee_id?: string
    },
  ) => api.post<Issue>(`/projects/${projectId}/issues`, data),
  update: (
    projectId: string,
    issueId: string,
    data: Partial<{
      title: string
      description: string
      status: IssueStatus
      priority: IssuePriority
      type: IssueType
      assignee_id: string | null
      order: number
    }>,
  ) => api.patch<Issue>(`/projects/${projectId}/issues/${issueId}`, data),
  delete: (projectId: string, issueId: string) =>
    api.delete(`/projects/${projectId}/issues/${issueId}`),
}

// ─── Comments ─────────────────────────────────────────────────────────────────

export const commentsApi = {
  list: (projectId: string, issueId: string) =>
    api.get<Comment[]>(`/projects/${projectId}/issues/${issueId}/comments`),
  create: (projectId: string, issueId: string, content: string) =>
    api.post<Comment>(`/projects/${projectId}/issues/${issueId}/comments`, { content }),
  update: (projectId: string, issueId: string, commentId: string, content: string) =>
    api.patch<Comment>(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`, { content }),
  delete: (projectId: string, issueId: string, commentId: string) =>
    api.delete(`/projects/${projectId}/issues/${issueId}/comments/${commentId}`),
}

// ─── Billing ──────────────────────────────────────────────────────────────────

export const billingApi = {
  createCheckout: (priceId?: string) =>
    api.post<{ url: string }>('/billing/checkout', { price_id: priceId }),
  billingPortal: () => api.post<{ url: string }>('/billing/portal'),
}
