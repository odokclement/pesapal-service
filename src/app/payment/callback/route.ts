import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderTrackingId = searchParams.get('OrderTrackingId');

  if (!orderTrackingId) {
    return NextResponse.redirect(new URL('/payment?status=failed', request.url));
  }

  // In production, verify payment status with PesaPal here
  // await verifyPaymentStatus(orderTrackingId);

  return NextResponse.redirect(
    new URL(`/payment/success?trackingId=${orderTrackingId}`, request.url)
  );
}