# Google Cloud Storage Setup Guide

## Overview
This guide will help you set up Google Cloud Storage for saving generated course content.

## Prerequisites
1. Google Cloud Platform account
2. Google Cloud project with billing enabled
3. Service account with Storage Admin permissions

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable billing for the project
4. Enable the Cloud Storage API

## Step 2: Create Service Account

1. In Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Name: `course-content-storage`
4. Description: `Service account for course content storage`
5. Click "Create and Continue"
6. Grant the following roles:
   - Storage Admin
   - Storage Object Admin
7. Click "Done"

## Step 3: Create Service Account Key

1. Click on the created service account
2. Go to "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the key file
6. Save it securely (e.g., `service-account-key.json`)

## Step 4: Create Storage Bucket

1. Go to "Cloud Storage" > "Buckets"
2. Click "Create Bucket"
3. Name: `course-content-storage` (or your preferred name)
4. Location: Choose a region close to your users
5. Class: Standard
6. Access control: Fine-grained
7. Protection: None (for this example)
8. Click "Create"

## Step 5: Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Google Cloud Storage Configuration
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_BUCKET_NAME="course-content-storage"
GOOGLE_CLOUD_KEY_FILE="path/to/your/service-account-key.json"

# Alternative: Use service account credentials directly
# GOOGLE_CLOUD_CLIENT_EMAIL="your-service-account@your-project.iam.gserviceaccount.com"
# GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## Step 6: Update Database Schema

Run the following commands to update your database:

```bash
# Generate Prisma client with new schema
npx prisma generate

# Push schema changes to database
npx prisma db push
```

## Step 7: Test the Integration

1. Start your development server: `npm run dev`
2. Create a course and generate some content
3. Check that content is being saved to Google Cloud Storage
4. Verify content can be retrieved and displayed

## Security Best Practices

1. **Never commit service account keys to version control**
2. **Use environment variables for all sensitive data**
3. **Set up proper IAM permissions (principle of least privilege)**
4. **Enable Cloud Audit Logs for monitoring**
5. **Regularly rotate service account keys**

## Production Deployment

For production deployment on Vercel:

1. Add environment variables in Vercel dashboard
2. Use service account credentials as environment variables instead of key file
3. Set up proper CORS policies for your bucket
4. Consider using signed URLs for secure access

## Troubleshooting

### Common Issues:

1. **"Permission denied" errors**
   - Check service account has proper roles
   - Verify bucket permissions

2. **"Project not found" errors**
   - Verify GOOGLE_CLOUD_PROJECT_ID is correct
   - Check service account has access to project

3. **"Bucket not found" errors**
   - Verify GOOGLE_CLOUD_BUCKET_NAME is correct
   - Check bucket exists in specified region

4. **"Invalid credentials" errors**
   - Verify service account key file path
   - Check key file format and permissions

## File Structure

Content will be stored in Google Cloud Storage with the following structure:

```
bucket-name/
├── user-id-1/
│   └── course-id-1/
│       └── unit-id-1/
│           ├── reading-2024-01-15T10-30-00-000Z.json
│           ├── homework-2024-01-15T10-35-00-000Z.json
│           └── lesson-plan-2024-01-15T10-40-00-000Z.json
└── user-id-2/
    └── course-id-2/
        └── unit-id-2/
            └── exam-2024-01-15T11-00-00-000Z.json
```

## API Endpoints

The following API endpoints have been updated to use Google Cloud Storage:

- `POST /api/content` - Save content to cloud storage
- `GET /api/content` - Retrieve content from cloud storage
- Content is automatically backed up and can be restored if needed

## Cost Considerations

- Google Cloud Storage pricing is based on:
  - Storage class (Standard, Nearline, Coldline, Archive)
  - Storage amount
  - Network egress
  - Operations (read/write requests)

- For typical course content usage, costs should be minimal
- Monitor usage in Google Cloud Console 