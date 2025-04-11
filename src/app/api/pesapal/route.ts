import { NextResponse } from 'next/server';
import axios from 'axios';

// Types
type CustomerDetails = {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
};

type PaymentRequest = {
  amount: number;
  description?: string;
  customer: CustomerDetails;
};

// Configuration
const config = {
  consumerKey: process.env.PESAPAL_CONSUMER_KEY!,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET!,
  environment: process.env.PESAPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
  callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`
};

// Updated base URL function
const getPesaPalBaseUrl = () => {
  if (config.environment === 'live') {
    return 'https://pay.pesapal.com/v3';
  }
  return 'https://cybqa.pesapal.com/pesapalv3';
};

const getAuthToken = async (): Promise<string> => {
  try {
    const response = await axios.post(
      `${getPesaPalBaseUrl()}/api/Auth/RequestToken`,
      {
        consumer_key: config.consumerKey,
        consumer_secret: config.consumerSecret,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    if (!response.data.token) {
      throw new Error('No token received from PesaPal');
    }

    return response.data.token;
  } catch (error) {
    console.error('PesaPal authentication error:', error);
    throw new Error(`Failed to authenticate with PesaPal: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export async function POST(request: Request) {
  try {
    const { amount, description, customer }: PaymentRequest = await request.json();

    // Validation
    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }
    if (!customer?.email) {
      return NextResponse.json(
        { success: false, error: 'Customer email is required' },
        { status: 400 }
      );
    }

    const token = await getAuthToken();
    
    const orderData = {
      id: `PAY-${Date.now()}`,
      currency: 'KES',
      amount,
      description: description || 'Payment for services',
      callback_url: config.callbackUrl,
      notification_id: '', // Add your IPN ID if you have one
      billing_address: {
        email_address: customer.email,
        phone_number: customer.phoneNumber || '',
        first_name: customer.firstName,
        last_name: customer.lastName,
      }
    };

    const response = await axios.post(
      `${getPesaPalBaseUrl()}/api/Transactions/SubmitOrderRequest`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    if (!response.data.order_tracking_id) {
      throw new Error('No order tracking ID received');
    }

    const redirectUrl = `${getPesaPalBaseUrl()}/api/Transactions/SubmitOrderRequest?orderTrackingId=${response.data.order_tracking_id}`;
    
    return NextResponse.json({ 
      success: true, 
      redirectUrl,
      message: 'Payment initiated successfully',
      trackingId: response.data.order_tracking_id
    });

  } catch (error) {
    console.error('Payment processing error:', error);
    
    let errorMessage = 'Payment processing failed';
    if (error instanceof Error) {
      errorMessage = error.message;
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.message || error.message;
      }
    }

    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        details: axios.isAxiosError(error) ? {
          status: error.response?.status,
          data: error.response?.data
        } : undefined
      },
      { status: 500 }
    );
  }
}