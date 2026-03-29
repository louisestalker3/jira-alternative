import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const features = [
  {
    icon: '⚡',
    title: 'Actually fast',
    desc: 'No 3-second loading screens. Everything loads instantly because we only load what you need.',
  },
  {
    icon: '🗂',
    title: 'Kanban that works',
    desc: 'Drag issues between columns. No config, no ceremony. Done.',
  },
  {
    icon: '💬',
    title: 'Comments & history',
    desc: 'Every issue has threaded comments and a full activity trail.',
  },
  {
    icon: '🏷',
    title: 'Priority & types',
    desc: 'Tag issues as bugs, features, tasks, or stories with low/medium/high/urgent priority.',
  },
  {
    icon: '💰',
    title: 'Flat-rate pricing',
    desc: 'Pro is $9/mo for your whole team. No per-seat tax. No surprise invoices.',
  },
  {
    icon: '🔓',
    title: 'Free tier forever',
    desc: '1 project, 10 issues. Enough to evaluate. No credit card required.',
  },
]

const testimonials = [
  {
    quote: "We migrated from Jira in an afternoon. Our whole team was onboarded in 10 minutes.",
    name: "Alex Chen",
    role: "CTO, Startup",
  },
  {
    quote: "Finally a tool that doesn't make me feel like I need a PhD to create a ticket.",
    name: "Sarah Miller",
    role: "Solo developer",
  },
  {
    quote: "Flat pricing is a game-changer. We went from $400/mo Jira to $9/mo here.",
    name: "James Park",
    role: "Eng lead, 12-person team",
  },
]

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">L</span>
          </div>
          <span className="font-semibold text-gray-900">Linear</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link to="/dashboard" className="btn-primary">
              Go to dashboard →
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Start free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
          <span>🎯</span>
          <span>The simpler, faster alternative to Jira</span>
        </div>
        <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
          Project management
          <br />
          <span className="text-brand-600">without the bloat</span>
        </h1>
        <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
          Built for indie developers and small teams who need Jira's core — issues, kanban, priorities — without
          the complexity, slowness, and per-seat pricing.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register" className="btn-primary text-base px-6 py-3">
            Start free — no card needed
          </Link>
          <a href="#pricing" className="btn-secondary text-base px-6 py-3">
            See pricing
          </a>
        </div>
        <p className="text-sm text-gray-400 mt-4">Free forever tier · Pro at $9/mo flat · Cancel anytime</p>
      </div>

      {/* Screenshot placeholder */}
      <div className="max-w-5xl mx-auto px-6 mb-24">
        <div className="bg-gray-900 rounded-2xl p-1 shadow-2xl">
          <div className="bg-gray-800 rounded-xl p-4">
            <div className="flex gap-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="grid grid-cols-4 gap-3">
              {['Backlog', 'To Do', 'In Progress', 'Done'].map((col) => (
                <div key={col} className="bg-gray-700 rounded-lg p-3">
                  <div className="text-gray-400 text-xs font-medium mb-2">{col}</div>
                  {[1, 2, 3].slice(0, col === 'In Progress' ? 2 : col === 'Done' ? 3 : 1).map((i) => (
                    <div key={i} className="bg-gray-600 rounded p-2 mb-2">
                      <div className="h-2 bg-gray-500 rounded mb-1 w-3/4" />
                      <div className="h-2 bg-gray-500 rounded w-1/2" />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Everything you need, nothing you don't
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-xl mx-auto">
          We studied the 10 most-upvoted Jira complaints and built around fixing them.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Teams that made the switch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card p-6">
                <p className="text-gray-700 mb-4 italic">"{t.quote}"</p>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div id="pricing" className="max-w-4xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
          Transparent pricing
        </h2>
        <p className="text-center text-gray-600 mb-12">No per-seat fees. No surprise bills.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {/* Free */}
          <div className="card p-8">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Free</h3>
            <div className="text-4xl font-bold text-gray-900 mb-1">$0</div>
            <p className="text-gray-500 text-sm mb-6">Forever</p>
            <ul className="space-y-3 mb-8 text-sm">
              {['1 project', '10 issues per project', 'Full kanban board', 'Comments & priorities'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/register" className="btn-secondary w-full">
              Get started free
            </Link>
          </div>

          {/* Pro */}
          <div className="card p-8 border-brand-500 border-2 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-brand-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                Most popular
              </span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Pro</h3>
            <div className="text-4xl font-bold text-gray-900 mb-1">$9</div>
            <p className="text-gray-500 text-sm mb-6">per month, whole team</p>
            <ul className="space-y-3 mb-8 text-sm">
              {[
                'Unlimited projects',
                'Unlimited issues',
                'Full kanban board',
                'Comments & priorities',
                'Priority support',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
            <Link to="/register" className="btn-primary w-full">
              Start free trial
            </Link>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-brand-600 py-16">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to ditch Jira?
          </h2>
          <p className="text-brand-100 mb-8">
            Get started in 2 minutes. No credit card. No setup fee.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center justify-center px-8 py-3 bg-white text-brand-700 font-semibold rounded-lg hover:bg-brand-50 transition-colors"
          >
            Create your free account →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">L</span>
            </div>
            <span className="text-sm">Linear — Jira Alternative</span>
          </div>
          <p className="text-xs">© {new Date().getFullYear()} · Built for teams who ship</p>
        </div>
      </footer>
    </div>
  )
}
