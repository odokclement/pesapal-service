"use client";
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaymentFailed() {
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const trackingId = searchParams.get('trackingId');

  return (
    <div className="max-w-md mx-auto p-6 text-center">
      <div className="text-red-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
      <p className="mb-4">We could  not process your payment.</p>
      {reason && <p className="text-sm text-gray-600">Reason: {reason}</p>}
      {trackingId && <p className="text-sm text-gray-600">Tracking ID: {trackingId}</p>}
      <div className="mt-6 space-x-4">
        <Link
          href="/"
          className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}