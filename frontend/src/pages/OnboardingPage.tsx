import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { authApi, projectsApi } from '../lib/api'
import { AxiosError } from 'axios'

const steps = ['Welcome', 'Create Project', 'Create First Issue', 'Done']

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)

  // Project form
  const [projectName, setProjectName] = useState('')
  const [projectKey, setProjectKey] = useState('')
  const [projectDescription, setProjectDescription] = useState('')
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null)

  // Issue form
  const [issueTitle, setIssueTitle] = useState('')

  const handleProjectKeyFromName = (name: string) => {
    const key = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 6)
    setProjectKey(key)
  }

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await projectsApi.create({
        name: projectName,
        key: projectKey,
        description: projectDescription || undefined,
      })
      setCreatedProjectId(res.data.id)
      setStep(2)
    } catch (err) {
      const msg = (err as AxiosError<{ detail: string }>)?.response?.data?.detail || 'Failed to create project'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIssue = async (e: FormEvent) => {
    e.preventDefault()
    if (!createdProjectId) return
    setLoading(true)
    try {
      const { issuesApi } = await import('../lib/api')
      await issuesApi.create(createdProjectId, { title: issueTitle })
      setStep(3)
    } catch (err) {
      const msg = (err as AxiosError<{ detail: string }>)?.response?.data?.detail || 'Failed to create issue'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleFinish = async () => {
    setLoading(true)
    try {
      await authApi.updateMe({ onboarded: true })
      await refreshUser()
      navigate(createdProjectId ? `/projects/${createdProjectId}` : '/dashboard', { replace: true })
    } catch {
      navigate('/dashboard', { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  i < step
                    ? 'bg-green-500 text-white'
                    : i === step
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="card p-8">
          {step === 0 && (
            <div className="text-center">
              <div className="text-5xl mb-4">👋</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
              </h1>
              <p className="text-gray-600 mb-8">
                Let's get you set up in under 5 minutes. We'll create your first project and issue together.
              </p>
              <div className="bg-brand-50 rounded-lg p-4 text-left mb-8">
                <h3 className="font-medium text-brand-900 mb-2">What we'll do:</h3>
                <ul className="space-y-1 text-sm text-brand-700">
                  <li>① Create a project (like a Jira "board")</li>
                  <li>② Add your first issue (task, bug, or feature)</li>
                  <li>③ See your kanban board live</li>
                </ul>
              </div>
              <button onClick={() => setStep(1)} className="btn-primary w-full">
                Let's go →
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Create your first project</h2>
              <p className="text-gray-500 text-sm mb-6">A project is a workspace for a product, team, or initiative.</p>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <div>
                  <label className="label">Project name</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="My Awesome App"
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e.target.value)
                      if (!projectKey || projectKey === projectName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)) {
                        handleProjectKeyFromName(e.target.value)
                      }
                    }}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">
                    Project key{' '}
                    <span className="text-gray-400 font-normal">(used to prefix issue numbers)</span>
                  </label>
                  <input
                    type="text"
                    className="input font-mono uppercase"
                    placeholder="APP"
                    value={projectKey}
                    onChange={(e) => setProjectKey(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
                    required
                    maxLength={6}
                  />
                </div>
                <div>
                  <label className="label">Description (optional)</label>
                  <textarea
                    className="input min-h-[80px] resize-none"
                    placeholder="What is this project about?"
                    value={projectDescription}
                    onChange={(e) => setProjectDescription(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Creating…' : 'Create project →'}
                </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Add your first issue</h2>
              <p className="text-gray-500 text-sm mb-6">
                An issue is any unit of work — a bug, feature, task, or idea.
              </p>
              <form onSubmit={handleCreateIssue} className="space-y-4">
                <div>
                  <label className="label">What needs to be done?</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Set up the landing page"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    className="btn-secondary flex-1"
                    onClick={() => setStep(3)}
                  >
                    Skip for now
                  </button>
                  <button type="submit" className="btn-primary flex-1" disabled={loading}>
                    {loading ? 'Creating…' : 'Create issue →'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="text-5xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set!</h2>
              <p className="text-gray-600 mb-8">
                Your project is ready. Start adding issues, drag them through your kanban board, and ship faster.
              </p>
              <div className="bg-green-50 rounded-lg p-4 text-left mb-8">
                <h3 className="font-medium text-green-900 mb-2">You're on the Free plan:</h3>
                <ul className="space-y-1 text-sm text-green-700">
                  <li>✓ 1 project</li>
                  <li>✓ 10 issues per project</li>
                  <li>✓ Unlimited comments</li>
                  <li className="text-gray-500">→ Upgrade to Pro for unlimited everything at $9/mo</li>
                </ul>
              </div>
              <button onClick={handleFinish} className="btn-primary w-full" disabled={loading}>
                {loading ? 'Loading…' : 'Go to my board →'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
