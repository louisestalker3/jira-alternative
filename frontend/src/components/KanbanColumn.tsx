import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Issue, IssueStatus } from '../lib/api'
import IssueCard from './IssueCard'

interface KanbanColumnProps {
  id: IssueStatus
  label: string
  colorClass: string
  issues: Issue[]
  projectId: string
  projectKey: string
}

export default function KanbanColumn({
  id,
  label,
  colorClass,
  issues,
  projectId,
  projectKey,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="flex-shrink-0 w-64">
      <div className="flex items-center gap-2 mb-3">
        <span className={`badge ${colorClass}`}>{label}</span>
        <span className="text-xs text-gray-400 font-medium">{issues.length}</span>
      </div>

      <SortableContext items={issues.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`space-y-2 min-h-[200px] rounded-lg p-2 transition-colors ${
            isOver ? 'bg-brand-50 border border-brand-200' : ''
          }`}
        >
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              projectId={projectId}
              projectKey={projectKey}
            />
          ))}
          {issues.length === 0 && (
            <div className="text-center py-8 text-xs text-gray-400">
              Drop issues here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
