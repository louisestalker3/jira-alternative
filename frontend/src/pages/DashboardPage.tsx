import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { projectsApi, Project } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'
import { AxiosError } from 'axios'

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [key, setKey] = useState('')
  const [description, setDescription] = useState('')

  const mutation = useMutation({
    mutationFn: () => projectsApi.create({ name, key, description: description || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created!')
      onClose()
    },
    onError: (err: AxiosError<{ detail: string }>) => {
      toast.error(err.response?.data?.detail || 'Failed to create project')
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
      <div className="card w-full max-w-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">New project</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-4"
        >
          <div>
            <label className="label">Project name</label>
            <input
              className="input"
              placeholder="My Project"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))
              }}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Key</label>
            <input
              className="input font-mono uppercase"
              placeholder="PROJ"
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
              required
              maxLength={6}
            />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea
              className="input resize-none min-h-[80px]"
              placeholder="What is this project about?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creating…' : 'Create project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="card p-5 hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center">
          <span className="text-brand-700 font-bold text-sm">{project.key.slice(0, 2)}</span>
        </div>
        <span className="text-xs text-gray-400 font-mono">{project.key}</span>
      </div>
      <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-brand-600 transition-colors">
        {project.name}
      </h3>
      {project.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-3">{project.description}</p>
      )}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>{project.issue_count} {project.issue_count === 1 ? 'issue' : 'issues'}</span>
        <span>·</span>
        <span>Created {new Date(project.created_at).toLocaleDateString()}</span>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [showCreateModal, setShowCreateModal] = useState(false)

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then((r) => r.data),
  })

  const canCreateProject = user?.plan === 'pro' || (projects?.length ?? 0) < 1

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {user?.plan === 'free' ? 'Free plan — 1 project limit' : 'Pro plan — unlimited projects'}
            </p>
          </div>
          <button
            onClick={() => {
              if (!canCreateProject) {
                toast.error('Upgrade to Pro for unlimited projects')
                return
              }
              setShowCreateModal(true)
            }}
            className="btn-primary"
          >
            + New project
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-5 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-lg mb-3" />
                <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : projects?.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h2>
            <p className="text-gray-500 mb-6">Create your first project to start tracking issues.</p>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              Create your first project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects?.map((p) => <ProjectCard key={p.id} project={p} />)}
            {canCreateProject && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="card p-5 border-dashed flex flex-col items-center justify-center gap-2 text-gray-400 hover:text-gray-600 hover:border-gray-300 transition-colors min-h-[140px]"
              >
                <span className="text-2xl">+</span>
                <span className="text-sm font-medium">New project</span>
              </button>
            )}
          </div>
        )}

        {!canCreateProject && user?.plan === 'free' && (
          <div className="mt-6 bg-brand-50 border border-brand-200 rounded-lg p-4 flex items-center justify-between">
            <div>
              <p className="text-brand-900 font-medium text-sm">Want unlimited projects?</p>
              <p className="text-brand-700 text-xs">Upgrade to Pro for $9/mo — your whole team, unlimited everything.</p>
            </div>
            <Link to="/billing" className="btn-primary text-xs px-3 py-1.5">
              Upgrade →
            </Link>
          </div>
        )}
      </div>

      {showCreateModal && <CreateProjectModal onClose={() => setShowCreateModal(false)} />}
    </Layout>
  )
}
