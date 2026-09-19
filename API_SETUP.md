# API Setup & Configuration Guide

ServiceAgent is architected with clean provider abstractions, allowing the system to run seamlessly out of the box using built-in simulation fallbacks while enabling production credentials via environment variables.

## Environment Variables Configuration

Create a `.env` file based on `.env.example`:

```bash
# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Payment Provider Configuration (Optional / India Razorpay)
RAZORPAY_KEY_ID=rzp_live_example
RAZORPAY_KEY_SECRET=example_secret_key

# Video KYC Provider Configuration (Optional)
VIDEO_KYC_PROVIDER=demo
HYPERVERGE_APP_ID=
HYPERVERGE_APP_KEY=

# WhatsApp / SMS Gateway (Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
```

## Running the API Server

The backend runs on Node.js using `tsx` in development and bundled `esbuild` CommonJS in production:

```bash
# Start development server on port 3000
npm run dev

# Run automated tests
npm test

# Build production bundle
npm run build

# Start production server
npm start
```

## Provider Status Verification

Admins can inspect the live status of all external providers directly via the Admin Console under the **System Status & Policies** tab.
