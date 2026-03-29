import { useState, FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { issuesApi, commentsApi, projectsApi, IssueStatus, IssuePriority, IssueType } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { AxiosError } from 'axios'

const STATUS_LABELS: Record<IssueStatus, string> = {
  backlog: 'Backlog',
  todo: 'To Do',
  in_progress: 'In Progress',
  in_review: 'In Review',
  done: 'Done',
}
const STATUS_COLORS: Record<IssueStatus, string> = {
  backlog: 'bg-gray-100 text-gray-600',
  todo: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  in_review: 'bg-purple-100 text-purple-700',
  done: 'bg-green-100 text-green-700',
}
const PRIORITY_COLORS: Record<IssuePriority, string> = {
  low: 'text-gray-400',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500',
}
const PRIORITY_ICONS: Record<IssuePriority, string> = {
  low: '▽',
  medium: '◇',
  high: '▲',
  urgent: '⚡',
}
const TYPE_ICONS: Record<IssueType, string> = {
  task: '☐',
  bug: '🐛',
  story: '📖',
  feature: '✨',
}

export default function IssuePage() {
  const { projectId, issueId } = useParams<{ projectId: string; issueId: string }>()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleValue, setTitleValue] = useState('')
  const [editingDesc, setEditingDesc] = useState(false)
  const [descValue, setDescValue] = useState('')
  const [commentText, setCommentText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!).then((r) => r.data),
    enabled: !!projectId,
  })

  const { data: issue, isLoading } = useQuery({
    queryKey: ['issue', projectId, issueId],
    queryFn: () => issuesApi.get(projectId!, issueId!).then((r) => r.data),
    enabled: !!projectId && !!issueId,
  })

  const { data: comments = [] } = useQuery({
    queryKey: ['comments', projectId, issueId],
    queryFn: () => commentsApi.list(projectId!, issueId!).then((r) => r.data),
    enabled: !!projectId && !!issueId,
  })

  const updateMutation = useMutation({
    mutationFn: (data: Parameters<typeof issuesApi.update>[2]) =>
      issuesApi.update(projectId!, issueId!, data),
    onSuccess: (res) => {
      queryClient.setQueryData(['issue', projectId, issueId], res.data)
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
    },
    onError: (err: AxiosError<{ detail: string }>) => {
      toast.error(err.response?.data?.detail || 'Update failed')
    },
  })

  const addCommentMutation = useMutation({
    mutationFn: (content: string) => commentsApi.create(projectId!, issueId!, content),
    onSuccess: () => {
      setCommentText('')
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, issueId] })
    },
    onError: () => toast.error('Failed to add comment'),
  })

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      commentsApi.update(projectId!, issueId!, id, content),
    onSuccess: () => {
      setEditingCommentId(null)
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, issueId] })
    },
  })

  const deleteCommentMutation = useMutation({
    mutationFn: (id: string) => commentsApi.delete(projectId!, issueId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', projectId, issueId] })
    },
  })

  if (isLoading || !issue) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      </Layout>
    )
  }

  const handleTitleSave = () => {
    if (titleValue.trim() && titleValue !== issue.title) {
      updateMutation.mutate({ title: titleValue.trim() })
    }
    setEditingTitle(false)
  }

  const handleDescSave = () => {
    if (descValue !== issue.description) {
      updateMutation.mutate({ description: descValue })
    }
    setEditingDesc(false)
  }

  const handleCommentSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    addCommentMutation.mutate(commentText.trim())
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/dashboard" className="hover:text-gray-700">Projects</Link>
          <span>/</span>
          <Link to={`/projects/${projectId}`} className="hover:text-gray-700">
            {project?.name ?? 'Project'}
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-mono">
            {project?.key}-{issue.number}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title */}
            <div>
              {editingTitle ? (
                <div className="flex gap-2">
                  <input
                    className="input text-xl font-bold flex-1"
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleTitleSave()
                      if (e.key === 'Escape') setEditingTitle(false)
                    }}
                    autoFocus
                  />
                </div>
              ) : (
                <h1
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:bg-gray-50 rounded px-1 -mx-1 py-0.5"
                  onClick={() => {
                    setTitleValue(issue.title)
                    setEditingTitle(true)
                  }}
                >
                  {issue.title}
                </h1>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              {editingDesc ? (
                <div>
                  <textarea
                    className="input min-h-[150px] resize-y"
                    value={descValue}
                    onChange={(e) => setDescValue(e.target.value)}
                    autoFocus
                    placeholder="Add a description…"
                  />
                  <div className="flex gap-2 mt-2">
                    <button className="btn-primary text-sm" onClick={handleDescSave}>
                      Save
                    </button>
                    <button className="btn-secondary text-sm" onClick={() => setEditingDesc(false)}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-gray-600 text-sm cursor-pointer hover:bg-gray-50 rounded p-2 -mx-2 min-h-[60px] whitespace-pre-wrap"
                  onClick={() => {
                    setDescValue(issue.description ?? '')
                    setEditingDesc(true)
                  }}
                >
                  {issue.description || (
                    <span className="text-gray-400 italic">Click to add a description…</span>
                  )}
                </div>
              )}
            </div>

            {/* Comments */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-4">
                Comments ({comments.length})
              </h3>
              <div className="space-y-4 mb-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-brand-700 text-xs font-bold">
                        {c.author.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">{c.author.name}</span>
                        <span className="text-xs text-gray-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {editingCommentId === c.id ? (
                        <div>
                          <textarea
                            className="input resize-none min-h-[80px]"
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2 mt-2">
                            <button
                              className="btn-primary text-xs"
                              onClick={() =>
                                updateCommentMutation.mutate({ id: c.id, content: editingCommentText })
                              }
                            >
                              Save
                            </button>
                            <button
                              className="btn-secondary text-xs"
                              onClick={() => setEditingCommentId(null)}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
                          {c.author_id === user?.id && (
                            <div className="flex gap-3 mt-1">
                              <button
                                className="text-xs text-gray-400 hover:text-gray-600"
                                onClick={() => {
                                  setEditingCommentId(c.id)
                                  setEditingCommentText(c.content)
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="text-xs text-red-400 hover:text-red-600"
                                onClick={() => deleteCommentMutation.mutate(c.id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleCommentSubmit} className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-brand-700 text-xs font-bold">
                    {user?.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <textarea
                    className="input resize-none min-h-[80px]"
                    placeholder="Add a comment…"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        handleCommentSubmit(e as unknown as FormEvent)
                      }
                    }}
                  />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-400">⌘+Enter to submit</span>
                    <button
                      type="submit"
                      className="btn-primary text-sm"
                      disabled={!commentText.trim() || addCommentMutation.isPending}
                    >
                      {addCommentMutation.isPending ? 'Saving…' : 'Comment'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-4 space-y-4">
              <div>
                <label className="label">Status</label>
                <select
                  className="input text-sm"
                  value={issue.status}
                  onChange={(e) => updateMutation.mutate({ status: e.target.value as IssueStatus })}
                >
                  {Object.entries(STATUS_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <div className="mt-1">
                  <span className={`badge ${STATUS_COLORS[issue.status]}`}>
                    {STATUS_LABELS[issue.status]}
                  </span>
                </div>
              </div>

              <div>
                <label className="label">Priority</label>
                <select
                  className="input text-sm"
                  value={issue.priority}
                  onChange={(e) => updateMutation.mutate({ priority: e.target.value as IssuePriority })}
                >
                  {(['low', 'medium', 'high', 'urgent'] as IssuePriority[]).map((p) => (
                    <option key={p} value={p}>
                      {PRIORITY_ICONS[p]} {p.charAt(0).toUpperCase() + p.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Type</label>
                <select
                  className="input text-sm"
                  value={issue.type}
                  onChange={(e) => updateMutation.mutate({ type: e.target.value as IssueType })}
                >
                  {(['task', 'bug', 'story', 'feature'] as IssueType[]).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_ICONS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Assignee</label>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  {issue.assignee ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center">
                        <span className="text-brand-700 text-xs font-bold">
                          {issue.assignee.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span>{issue.assignee.name}</span>
                      <button
                        className="text-xs text-gray-400 hover:text-red-500 ml-auto"
                        onClick={() => updateMutation.mutate({ assignee_id: null })}
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <span className="text-gray-400">Unassigned</span>
                  )}
                </div>
              </div>
            </div>

            <div className="card p-4 space-y-2 text-xs text-gray-500">
              <div className="flex justify-between">
                <span>Created</span>
                <span>{new Date(issue.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Updated</span>
                <span>{new Date(issue.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Reporter</span>
                <span>{user?.id === issue.reporter_id ? 'You' : issue.reporter_id.slice(0, 8)}</span>
              </div>
            </div>

            <Link
              to={`/projects/${projectId}`}
              className="btn-secondary w-full text-sm"
            >
              ← Back to board
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
