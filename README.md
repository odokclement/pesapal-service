# PesaPal Payment Integration

This project integrates PesaPal payment gateway with a Next.js application, allowing for seamless payment processing.

## Overview

The PesaPal service integration enables your application to process payments through the PesaPal gateway. This implementation handles the full payment flow including initial requests, callbacks, and success/failure scenarios.

## Project Structure

```
PESAPAL-SERVICE/
├── .next/
├── node_modules/
├── public/
├── src/
│   └── app/
│       ├── api/
│       │   └── pesapal/
│       │       └── route.ts         # API endpoint for PesaPal integration
│       ├── components/              # Reusable components
│       └── payment/
│           ├── callback/
│           │   └── route.ts         # Callback handler for PesaPal responses
│           ├── failed/
│           │   └── page.tsx         # Failed payment page
│           └── success/
│               └── page.tsx         # Successful payment page
├── .env.local                       # Environment variables (not committed to git)
├── .gitignore
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package-lock.json
├── package.json
├── postcss.config.mjs
└── tsconfig.json
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- PesaPal merchant account

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn install
   ```

3. Configure environment variables:
   Create a `.env.local` file in the root directory with the following variables:
   ```
   PESAPAL_CONSUMER_KEY=your_consumer_key
   PESAPAL_CONSUMER_SECRET=your_consumer_secret
   PESAPAL_API_URL=https://pay.pesapal.com/v3
   NEXT_PUBLIC_APP_URL=your_app_url
   ```

### Running the Application

Development mode:
```
npm run dev
```

Production build:
```
npm run build
npm start
```

## Using the PesaPal Integration

### Initiating a Payment

To initiate a payment, make a POST request to `/api/pesapal` with the following payload:

```json
{
  "amount": 1000,
  "currency": "KES",
  "description": "Payment for Order #123",
  "callback_url": "/payment/callback",
  "notification_id": "unique-notification-id",
  "billing_address": {
    "email_address": "customer@example.com",
    "phone_number": "+254712345678",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

### Payment Flow

1. The API initiates a payment request to PesaPal
2. User is redirected to PesaPal payment page
3. After payment processing, PesaPal redirects to the callback URL
4. The callback handler processes the response and redirects to:
   - `/payment/success` for successful payments
   - `/payment/failed` for failed payments

## Webhook Integration

PesaPal sends IPN (Instant Payment Notification) to your designated URL. Configure this in your PesaPal merchant dashboard.

## Troubleshooting

- Ensure all environment variables are correctly set
- Check the PesaPal dashboard for transaction status if callbacks aren't working
- Verify that your callback URL is accessible from the internet

## Security Notes

- Never commit `.env.local` or any files containing API keys
- Use HTTPS in production
- Validate all incoming data before processing

## References

- [PesaPal API Documentation](https://developer.pesapal.com/)
- [Next.js Documentation](https://nextjs.org/docs)

## License

@odokclement
