/**
 * Remotion Lambda Deployment Script
 *
 * Run with: npx ts-node scripts/deploy-lambda.ts
 *
 * Prerequisites:
 * 1. AWS account with appropriate permissions
 * 2. AWS credentials configured (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
 * 3. Run `npx remotion lambda policies role` first to create IAM role
 */

import {
  deploySite,
  deployFunction,
  getOrCreateBucket,
  getSites,
  getFunctions,
} from "@remotion/lambda";
import path from "path";

const REGION = "eu-central-1"; // Frankfurt - close to German users
const RAM = 2048; // MB - balance between speed and cost
const TIMEOUT = 240; // seconds
const DISK = 2048; // MB

async function deploy() {
  console.log("🚀 Starting Remotion Lambda deployment...\n");

  // Check for AWS credentials
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ AWS credentials not found!");
    console.log("\nPlease set these environment variables:");
    console.log("  AWS_ACCESS_KEY_ID=your_access_key");
    console.log("  AWS_SECRET_ACCESS_KEY=your_secret_key");
    console.log("\nOr configure AWS CLI: aws configure");
    process.exit(1);
  }

  try {
    // Step 1: Get or create S3 bucket
    console.log("📦 Creating/getting S3 bucket...");
    const { bucketName } = await getOrCreateBucket({ region: REGION });
    console.log(`   Bucket: ${bucketName}\n`);

    // Step 2: Deploy the Remotion bundle (site)
    console.log("📤 Deploying Remotion site to S3...");
    const { serveUrl } = await deploySite({
      bucketName,
      entryPoint: path.resolve(__dirname, "../src/index.ts"),
      region: REGION,
      siteName: "beethoven-video-renderer",
    });
    console.log(`   Site URL: ${serveUrl}\n`);

    // Step 3: Deploy Lambda function
    console.log("⚡ Deploying Lambda function...");
    const { functionName, alreadyExisted } = await deployFunction({
      region: REGION,
      timeoutInSeconds: TIMEOUT,
      memorySizeInMb: RAM,
      diskSizeInMb: DISK,
      createCloudWatchLogGroup: true,
    });
    console.log(
      `   Function: ${functionName} (${alreadyExisted ? "updated" : "created"})\n`
    );

    // Output configuration
    console.log("✅ Deployment complete!\n");
    console.log("Add these to your .env.local:");
    console.log("─".repeat(50));
    console.log(`REMOTION_AWS_REGION=${REGION}`);
    console.log(`REMOTION_BUCKET_NAME=${bucketName}`);
    console.log(`REMOTION_SERVE_URL=${serveUrl}`);
    console.log(`REMOTION_FUNCTION_NAME=${functionName}`);
    console.log("─".repeat(50));

    // List current deployments
    console.log("\n📋 Current deployments:");
    const sites = await getSites({ region: REGION, bucketName });
    console.log(`   Sites: ${sites.sites.length}`);
    const functions = await getFunctions({ region: REGION, compatibleOnly: true });
    console.log(`   Functions: ${functions.length}`);
  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

deploy();
