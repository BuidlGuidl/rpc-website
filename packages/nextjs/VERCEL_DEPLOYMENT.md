# Vercel Deployment Setup

This document explains how to deploy your RPC website to Vercel with Firebase environment variables.

## Problem

When deploying to Vercel, the build process fails because Firebase environment variables from your local `.env.local` file are not available during the build process.

## Solution

You need to configure environment variables in Vercel so they're available during both build time and runtime.

## Setting Up Environment Variables in Vercel

### Option 1: Using Vercel Dashboard (Recommended)

1. Go to your project on [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project → Settings → Environment Variables
3. Add each of the following environment variables:

| Variable Name | Description | Example Value |
|---------------|-------------|---------------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID | `buidlguidl-client` |
| `FIREBASE_PRIVATE_KEY_ID` | Private key ID from service account | `7265c59d3958976819c6e38233a5d362f011b76b` |
| `FIREBASE_CLIENT_EMAIL` | Service account email | `firebase-adminsdk-fbsvc@buidlguidl-client.iam.gserviceaccount.com` |
| `FIREBASE_CLIENT_ID` | Client ID from service account | `117444490442052205295` |
| `FIREBASE_CLIENT_X509_CERT_URL` | Certificate URL from service account | `https://www.googleapis.com/robot/v1/metadata/x509/...` |
| `FIREBASE_PRIVATE_KEY` | **Most Important** - See format below | See format below |

### Critical: FIREBASE_PRIVATE_KEY Format

The private key is the trickiest to set up. In Vercel, paste the **entire private key exactly as it appears in your Firebase service account JSON file**, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines with actual newlines:

```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDWP8bR03WsfT6m
Ii3LLYH3RnQoBtgjxQfFBw5aqeSgmO6cyEMMqo8s+JyWFBQvSttJFfjTs7adO5FV
INLx3h9E1peQSdtEZRA7X2GZ04/CTfoScL5qyljXjx83iFFtK/rujpz/G0g5Szxe
...rest of your private key...
-----END PRIVATE KEY-----
```

**Do NOT** use `\\n` in Vercel - use actual line breaks.

### Option 2: Using Vercel CLI

```bash
# Set environment variables using Vercel CLI
vercel env add FIREBASE_PROJECT_ID
vercel env add FIREBASE_PRIVATE_KEY_ID
vercel env add FIREBASE_CLIENT_EMAIL
vercel env add FIREBASE_CLIENT_ID
vercel env add FIREBASE_CLIENT_X509_CERT_URL
vercel env add FIREBASE_PRIVATE_KEY
```

For the private key with CLI, you can paste it as a multiline string when prompted.

## Environment Scopes

Make sure to set the environment variables for:
- ✅ **Production** (required for live deployments)
- ✅ **Preview** (required for branch deployments)
- ✅ **Development** (optional, useful for `vercel dev`)

## Testing the Deployment

1. After setting up environment variables, trigger a new deployment
2. Check the build logs to ensure no "Missing Firebase environment variables" errors
3. Test your Firebase API endpoints in production

## Troubleshooting

### Build Still Fails with Missing Variables
- Double-check variable names (they're case-sensitive)
- Ensure you've set variables for the correct environment (Production/Preview)
- Try a fresh deployment after setting variables

### "Invalid PEM formatted message" Error
- Check that your `FIREBASE_PRIVATE_KEY` has proper line breaks (not `\\n`)
- Ensure the private key includes the BEGIN/END lines
- Verify there are no extra spaces or characters

### Firebase Functions Don't Work
- Check Vercel function logs for specific error messages
- Ensure all 6 environment variables are set correctly
- Verify your Firebase service account has the necessary permissions

## Code Changes Made

The Firebase admin initialization has been updated to:
- ✅ Use lazy initialization (only initializes when actually used)
- ✅ Handle missing environment variables gracefully during build
- ✅ Provide clear error messages when variables are missing
- ✅ Work with both local development and Vercel deployment