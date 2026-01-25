# AWS Setup for Remotion Lambda

## Prerequisites

1. **AWS Account** - Create one at https://aws.amazon.com if you don't have one
2. **Node.js 18+** installed

## Step 1: Create IAM User

1. Go to [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Click "Users" → "Create user"
3. Name: `remotion-renderer`
4. Click "Next"
5. Select "Attach policies directly"
6. Create a new policy with this JSON:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:*",
        "lambda:*",
        "iam:PassRole",
        "logs:*",
        "cloudwatch:*"
      ],
      "Resource": "*"
    }
  ]
}
```

7. Name the policy: `RemotionFullAccess`
8. Attach it to the user
9. Click "Create user"

## Step 2: Create Access Keys

1. Click on the new user
2. Go to "Security credentials" tab
3. Click "Create access key"
4. Select "Application running outside AWS"
5. **Save the Access Key ID and Secret Access Key**

## Step 3: Configure Environment

Add to your `.env.local`:

```bash
# AWS Credentials for Remotion Lambda
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=eu-central-1
```

## Step 4: Create Lambda Role

Run this command to create the necessary IAM role:

```bash
cd my-video
npx remotion lambda policies role
```

Follow the prompts. This creates:
- IAM Role: `remotion-lambda-role`
- Necessary permissions for Lambda execution

## Step 5: Deploy Remotion Lambda

```bash
cd my-video
npx ts-node scripts/deploy-lambda.ts
```

This will:
1. Create an S3 bucket for the Remotion bundle
2. Upload the video composition code
3. Deploy the Lambda function

## Step 6: Update Environment Variables

After deployment, add the output values to `.env.local`:

```bash
REMOTION_AWS_REGION=eu-central-1
REMOTION_BUCKET_NAME=remotionlambda-xxxxxxxx
REMOTION_SERVE_URL=https://remotionlambda-xxxxxxxx.s3.eu-central-1.amazonaws.com/sites/beethoven-video-renderer/index.html
REMOTION_FUNCTION_NAME=remotion-render-xxxx
```

## Estimated Costs

| Component | Cost |
|-----------|------|
| Lambda execution | ~$0.02 per minute of video |
| S3 storage | ~$0.023 per GB/month |
| S3 transfer | ~$0.09 per GB |

**Example**: A 1-minute video render costs approximately $0.05-0.10

## Troubleshooting

### "Access Denied" errors
- Check IAM user has the `RemotionFullAccess` policy
- Verify access keys are correct

### Lambda timeout
- Increase `TIMEOUT` in deploy script (max 900 seconds)
- Increase RAM for faster processing

### "Function not found"
- Run deployment script again
- Check AWS region matches

## Alternative: Remotion Cloud

If you prefer managed infrastructure:
1. Go to https://remotion.dev/cloud
2. Sign up for Remotion Cloud
3. Get API key
4. Use `@remotion/cloudrun` instead

This handles all AWS setup automatically.
