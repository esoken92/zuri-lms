'use client'

import { useRouter } from 'next/navigation'

export default function PendingApprovalPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100 mb-4">
            <svg className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Account Pending Approval</h2>
          <p className="mt-4 text-gray-600">
            Your account has been created successfully and is currently pending approval from an administrator.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            You will be able to log in once your account has been approved. This usually takes 1-2 business days.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">What happens next?</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• An administrator will review your account</li>
            <li>• You will receive an email when approved</li>
            <li>• You can then log in with your credentials</li>
          </ul>
        </div>

        <button
          onClick={() => router.push('/')}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Return to Login
        </button>
      </div>
    </div>
  )
}
