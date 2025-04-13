import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    console.log('IPN Callback:', data);
    
    // Verify payment status here (you would typically call PesaPal's API)
    
    return NextResponse.json({ success: true });
    
  } catch (error: unknown) {
      console.error('Callback error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }
}

// PesaPal may initially verify your callback with a GET request
export async function GET() {
  return NextResponse.json(
    { message: 'Callback URL is valid' },
    { status: 200 }
  );
}