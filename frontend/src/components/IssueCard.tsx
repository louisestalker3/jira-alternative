import { Link } from 'react-router-dom'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Issue, IssuePriority, IssueType } from '../lib/api'

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

interface IssueCardProps {
  issue: Issue
  projectId: string
  projectKey: string
  isDragging?: boolean
}

export default function IssueCard({ issue, projectId, projectKey, isDragging = false }: IssueCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: sortableDragging } =
    useSortable({ id: issue.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`card p-3 cursor-grab active:cursor-grabbing group ${
        sortableDragging || isDragging ? 'opacity-50 shadow-lg' : 'hover:shadow-md'
      } transition-all`}
    >
      <div className="flex items-start gap-2 mb-2">
        <span className="text-sm flex-shrink-0">{TYPE_ICONS[issue.type]}</span>
        <Link
          to={`/projects/${projectId}/issues/${issue.id}`}
          className="text-sm text-gray-800 hover:text-brand-600 font-medium leading-tight line-clamp-2 flex-1"
          onClick={(e) => e.stopPropagation()}
        >
          {issue.title}
        </Link>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono text-gray-400`}>
            {projectKey}-{issue.number}
          </span>
          {issue.comment_count > 0 && (
            <span className="text-xs text-gray-400">💬 {issue.comment_count}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-sm ${PRIORITY_COLORS[issue.priority]}`} title={issue.priority}>
            {PRIORITY_ICONS[issue.priority]}
          </span>
          {issue.assignee && (
            <div
              className="w-5 h-5 rounded-full bg-brand-100 flex items-center justify-center"
              title={issue.assignee.name}
            >
              <span className="text-brand-700 text-xs font-bold">
                {issue.assignee.name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
