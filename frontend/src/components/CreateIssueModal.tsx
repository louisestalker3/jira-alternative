import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { issuesApi, IssueStatus, IssuePriority, IssueType } from '../lib/api'
import { AxiosError } from 'axios'

interface CreateIssueModalProps {
  projectId: string
  defaultStatus?: IssueStatus
  onClose: () => void
}

export default function CreateIssueModal({
  projectId,
  defaultStatus = 'todo',
  onClose,
}: CreateIssueModalProps) {
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<IssueStatus>(defaultStatus)
  const [priority, setPriority] = useState<IssuePriority>('medium')
  const [type, setType] = useState<IssueType>('task')

  const mutation = useMutation({
    mutationFn: () =>
      issuesApi.create(projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        type,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues', projectId] })
      toast.success('Issue created')
      onClose()
    },
    onError: (err: AxiosError<{ detail: string }>) => {
      toast.error(err.response?.data?.detail || 'Failed to create issue')
    },
  })

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="card w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New issue</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            mutation.mutate()
          }}
          className="space-y-4"
        >
          <div>
            <input
              className="input text-base font-medium"
              placeholder="Issue title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div>
            <textarea
              className="input resize-none min-h-[100px]"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Type</label>
              <select
                className="input text-sm"
                value={type}
                onChange={(e) => setType(e.target.value as IssueType)}
              >
                <option value="task">☐ Task</option>
                <option value="bug">🐛 Bug</option>
                <option value="story">📖 Story</option>
                <option value="feature">✨ Feature</option>
              </select>
            </div>
            <div>
              <label className="label">Priority</label>
              <select
                className="input text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as IssuePriority)}
              >
                <option value="low">▽ Low</option>
                <option value="medium">◇ Medium</option>
                <option value="high">▲ High</option>
                <option value="urgent">⚡ Urgent</option>
              </select>
            </div>
            <div>
              <label className="label">Status</label>
              <select
                className="input text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
              >
                <option value="backlog">Backlog</option>
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="done">Done</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary flex-1"
              disabled={!title.trim() || mutation.isPending}
            >
              {mutation.isPending ? 'Creating…' : 'Create issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
