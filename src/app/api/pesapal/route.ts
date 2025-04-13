import { NextResponse } from 'next/server';
import axios from 'axios';

// Configuration
const config = {
  consumerKey: process.env.PESAPAL_CONSUMER_KEY!,
  consumerSecret: process.env.PESAPAL_CONSUMER_SECRET!,
  environment: process.env.PESAPAL_ENVIRONMENT === 'live' ? 'live' : 'sandbox',
  callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/callback`
};

// For PesaPal API v3
const getPesaPalBaseUrl = () => {
  return config.environment === 'live' 
    ? 'https://pay.pesapal.com/v3' 
    : 'https://cybqa.pesapal.com/pesapalv3';
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
        timeout: 10000
      }
    );

    if (!response.data?.token) {
      console.error('Auth response:', response.data);
      throw new Error('PesaPal returned empty token');
    }

    return response.data.token;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error('Authentication error:', {
        message: error.message,
        response: error.response?.data,
        config: error.config
      });
      throw new Error(`Authentication failed: ${error.response?.data?.error?.message || error.message}`);
    }
    console.error('Unexpected error:', error);
    throw new Error('An unexpected error occurred');
  }
}

export async function POST(request: Request) {
  try {
    const { amount, description, customer } = await request.json();

    // Validate input
    if (!amount || isNaN(amount)) {
      return NextResponse.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }

    const token = await getAuthToken();
    
    const orderData = {
      id: `ORDER-${Date.now()}`,
      currency: 'KES',
      amount,
      description: description || 'Payment for services',
      callback_url: config.callbackUrl,
      notification_id: '5423db16-9e87-4050-9113-dfe54bc4db0f', // Add your IPN ID if you have one
      billing_address: {
        email_address: customer?.email || '',
        phone_number: customer?.phoneNumber || '',
        first_name: customer?.firstName || 'Customer',
        last_name: customer?.lastName || 'Name',
      }
    };

    console.log('Submitting order to PesaPal:', orderData);

    const response = await axios.post(
      `${getPesaPalBaseUrl()}/api/Transactions/SubmitOrderRequest`,
      orderData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('PesaPal order response:', response.data);

    if (!response.data?.order_tracking_id) {
      console.error('Invalid response structure:', response.data);
      throw new Error('PesaPal did not return an order tracking ID. Response: ' + JSON.stringify(response.data));
    }

    // Construct the correct redirect URL for PesaPal v3
    const redirectUrl = `${getPesaPalBaseUrl()}/api/Transactions/SubmitOrderRequest?orderTrackingId=${response.data.order_tracking_id}`;
    
    return NextResponse.json({
      success: true,
      redirectUrl,
      trackingId: response.data.order_tracking_id
    });

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Payment processing error:', {
        message: error.message,
        stack: error.stack,
        response: axios.isAxiosError(error) ? error.response?.data : undefined,
        config: axios.isAxiosError(error) ? error.config : undefined
      });
    } else {
      console.error('Unexpected error:', error);
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        ...(process.env.NODE_ENV === 'development' && {
          debug: {
            apiEndpoint: `${getPesaPalBaseUrl()}/api/Transactions/SubmitOrderRequest`,
            environment: config.environment
          }
        })
      },
      { status: 500 }
    );
  }
}