import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { billingApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import Layout from '../components/Layout'

export default function BillingPage() {
  const { user, refreshUser } = useAuth()
  const [searchParams] = useSearchParams()
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    if (searchParams.get('success')) {
      toast.success('Upgrade successful! Welcome to Pro 🎉')
      refreshUser()
    } else if (searchParams.get('canceled')) {
      toast.error('Checkout canceled.')
    }
  }, [])

  const checkoutMutation = useMutation({
    mutationFn: () => billingApi.createCheckout(),
    onSuccess: (res) => {
      setRedirecting(true)
      window.location.href = res.data.url
    },
    onError: () => toast.error('Failed to start checkout. Is Stripe configured?'),
  })

  const portalMutation = useMutation({
    mutationFn: () => billingApi.billingPortal(),
    onSuccess: (res) => {
      setRedirecting(true)
      window.location.href = res.data.url
    },
    onError: () => toast.error('Failed to open billing portal'),
  })

  const isPro = user?.plan === 'pro'

  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Billing</h1>
        <p className="text-gray-500 mb-8">Manage your plan and payment method.</p>

        {/* Current plan */}
        <div className="card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Current plan</h2>
            <span
              className={`badge ${
                isPro ? 'bg-brand-100 text-brand-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {isPro ? 'Pro' : 'Free'}
            </span>
          </div>

          {isPro ? (
            <div>
              <p className="text-gray-600 text-sm mb-4">
                You're on the <strong>Pro plan</strong> at <strong>$9/month</strong>.
                Unlimited projects, unlimited issues, priority support.
              </p>
              <button
                className="btn-secondary"
                onClick={() => portalMutation.mutate()}
                disabled={portalMutation.isPending || redirecting}
              >
                {portalMutation.isPending || redirecting
                  ? 'Redirecting…'
                  : 'Manage billing →'}
              </button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 text-sm mb-4">
                You're on the <strong>Free plan</strong> — 1 project, 10 issues.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4 text-sm text-gray-600">
                <strong>Free limits:</strong>
                <ul className="mt-2 space-y-1">
                  <li>✓ 1 project</li>
                  <li>✓ 10 issues per project</li>
                  <li>✓ Unlimited comments</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Pro plan card */}
        {!isPro && (
          <div className="card p-6 border-brand-500 border-2">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">Pro</h2>
                <p className="text-gray-500 text-sm">Flat rate for your whole team</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">$9</div>
                <div className="text-sm text-gray-500">/ month</div>
              </div>
            </div>

            <ul className="space-y-2 mb-6 text-sm">
              {[
                'Unlimited projects',
                'Unlimited issues',
                'Unlimited comments',
                'Priority support',
                'No per-seat fees',
                'Cancel anytime',
              ].map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <span className="text-green-500 font-bold">✓</span>
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>

            <button
              className="btn-primary w-full"
              onClick={() => checkoutMutation.mutate()}
              disabled={checkoutMutation.isPending || redirecting}
            >
              {checkoutMutation.isPending || redirecting
                ? 'Redirecting to Stripe…'
                : 'Upgrade to Pro →'}
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">
              Secure checkout via Stripe. Cancel anytime.
            </p>
          </div>
        )}

        <div className="mt-8 text-center">
          <Link to="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </Layout>
  )
}
