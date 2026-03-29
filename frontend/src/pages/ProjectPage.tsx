import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { projectsApi, issuesApi, Issue, IssueStatus } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import KanbanColumn from '../components/KanbanColumn'
import IssueCard from '../components/IssueCard'
import CreateIssueModal from '../components/CreateIssueModal'
import { AxiosError } from 'axios'

const COLUMNS: { id: IssueStatus; label: string; color: string }[] = [
  { id: 'backlog', label: 'Backlog', color: 'bg-gray-100 text-gray-600' },
  { id: 'todo', label: 'To Do', color: 'bg-blue-100 text-blue-700' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'in_review', label: 'In Review', color: 'bg-purple-100 text-purple-700' },
  { id: 'done', label: 'Done', color: 'bg-green-100 text-green-700' },
]

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectsApi.get(projectId!).then((r) => r.data),
    enabled: !!projectId,
  })

  const { data: issues = [], isLoading: issuesLoading } = useQuery({
    queryKey: ['issues', projectId],
    queryFn: () => issuesApi.list(projectId!).then((r) => r.data),
    enabled: !!projectId,
  })

  const updateMutation = useMutation({
    mutationFn: ({ issueId, data }: { issueId: string; data: { status?: IssueStatus; order?: number } }) =>
      issuesApi.update(projectId!, issueId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
    },
    onError: (err: AxiosError<{ detail: string }>) => {
      toast.error(err.response?.data?.detail || 'Failed to update issue')
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
    },
  })

  const deleteProjectMutation = useMutation({
    mutationFn: () => projectsApi.delete(projectId!),
    onSuccess: () => {
      toast.success('Project deleted')
      navigate('/dashboard')
    },
  })

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragStart = (event: DragStartEvent) => {
    const issue = issues.find((i) => i.id === event.active.id)
    setActiveIssue(issue ?? null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveIssue(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const issue = issues.find((i) => i.id === active.id)
    if (!issue) return

    // If dropped on a column id directly
    const newStatus = COLUMNS.find((c) => c.id === over.id)?.id
    if (newStatus && newStatus !== issue.status) {
      updateMutation.mutate({ issueId: issue.id, data: { status: newStatus } })
      return
    }

    // If dropped on another issue
    const targetIssue = issues.find((i) => i.id === over.id)
    if (targetIssue && targetIssue.status !== issue.status) {
      updateMutation.mutate({ issueId: issue.id, data: { status: targetIssue.status } })
    }
  }

  const issuesByStatus = COLUMNS.reduce(
    (acc, col) => {
      acc[col.id] = issues.filter((i) => i.status === col.id).sort((a, b) => a.order - b.order)
      return acc
    },
    {} as Record<IssueStatus, Issue[]>,
  )

  const canCreateIssue = user?.plan === 'pro' || issues.length < 10

  if (projectLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
        </div>
      </Layout>
    )
  }

  if (!project) {
    return (
      <Layout>
        <div className="text-center py-20">
          <p className="text-gray-500">Project not found.</p>
          <Link to="/dashboard" className="btn-primary mt-4 inline-flex">
            Back to dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Project header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">
              Projects
            </Link>
            <span className="text-gray-300">/</span>
            <h1 className="font-semibold text-gray-900">{project.name}</h1>
            <span className="text-xs font-mono text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {project.key}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {issues.length} {issues.length === 1 ? 'issue' : 'issues'}
              {user?.plan === 'free' && ` / 10 free`}
            </span>
            <button
              onClick={() => {
                if (!canCreateIssue) {
                  toast.error('Free plan limited to 10 issues. Upgrade to Pro!')
                  return
                }
                setShowCreateModal(true)
              }}
              className="btn-primary text-sm"
            >
              + Issue
            </button>
            <button
              onClick={() => {
                if (confirm(`Delete "${project.name}"? This cannot be undone.`)) {
                  deleteProjectMutation.mutate()
                }
              }}
              className="btn-ghost text-sm text-red-500 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Kanban board */}
        {issuesLoading ? (
          <div className="flex items-center justify-center flex-1">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-4 p-6 overflow-x-auto flex-1">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.id}
                  id={col.id}
                  label={col.label}
                  colorClass={col.color}
                  issues={issuesByStatus[col.id]}
                  projectId={projectId!}
                  projectKey={project.key}
                />
              ))}
            </div>
            <DragOverlay>
              {activeIssue && (
                <IssueCard
                  issue={activeIssue}
                  projectId={projectId!}
                  projectKey={project.key}
                  isDragging
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {showCreateModal && (
        <CreateIssueModal
          projectId={projectId!}
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </Layout>
  )
}
