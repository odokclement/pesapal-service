import { NextResponse } from 'next/server';
import axios from 'axios';

const config = {
  consumerKey: process.env.PESAPAL_CONSUMER_KEY!,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET!,
  environment: process.env.PESAPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
};

const getPesaPalBaseUrl = () => {
  return config.environment === 'live' 
    ? 'https://pay.pesapal.com/v3' 
    : 'https://cybqa.pesapal.com/pesapalv3';
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderTrackingId = searchParams.get('OrderTrackingId');
    const orderMerchantReference = searchParams.get('OrderMerchantReference');

    if (!orderTrackingId) {
      return NextResponse.redirect(new URL('/payment?error=no_tracking_id', request.url));
    }

    // Verify payment status with PesaPal
    const tokenResponse = await axios.post(
      `${getPesaPalBaseUrl()}/api/Auth/RequestToken`,
      {
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
      }
    );

    const statusResponse = await axios.get(
      `${getPesaPalBaseUrl()}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        headers: {
          'Authorization': `Bearer ${tokenResponse.data.token}`,
          'Accept': 'application/json'
        }
      }
    );

    console.log('Payment status response:', statusResponse.data);

    // Redirect to success or failure page based on payment status
    if (statusResponse.data.status_code === 1) {
      return NextResponse.redirect(
        new URL(`/payment/success?trackingId=${orderTrackingId}&reference=${orderMerchantReference}`, request.url)
      );
    }

    return NextResponse.redirect(
      new URL(`/payment/failed?trackingId=${orderTrackingId}&reason=${statusResponse.data.message || 'unknown'}`, request.url)
    );

  } catch (error) {
    console.error('Callback error:', error);
    return NextResponse.redirect(
      new URL('/payment/failed?reason=callback_error', request.url)
    );
  }
}