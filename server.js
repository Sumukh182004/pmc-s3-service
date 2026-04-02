// Import necessary modules
const express = require('express');
const AWS = require('aws-sdk');
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express app
const app = express();

// AWS Account configurations (set via environment variables)
const awsAccounts = {

    BZTECHSERVER: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'ap-south-1'
    }
};

// Middleware setup
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Define endpoint to get signed URL for uploading to S3
app.post('/gsu', (req, res) => {
    let { bucket, key1, Expires, account } = req.body;

    // Validate required parameters
    if (!bucket || !key1 || !Expires || !account) {
        return res.status(400).json({
            error: 'Missing required parameters. Please provide bucket, key1, Expires, and account.'
        });
    }

    // Validate account parameter
    if (!awsAccounts[account]) {
        return res.status(400).json({
            error: `Invalid account. Supported accounts are: ${Object.keys(awsAccounts).join(', ')}`
        });
    }

    // Set up parameters for the signed URL
    const params = {
        Bucket: bucket,
        Key: key1,
        Expires: Expires
    };

    // Get the selected account configuration
    const selectedAccount = awsAccounts[account];

    // Create S3 instance with specific account credentials
    const s3 = new AWS.S3({
        accessKeyId: selectedAccount.accessKeyId,
        secretAccessKey: selectedAccount.secretAccessKey,
        region: selectedAccount.region
    });

    // Generate the signed URL
    s3.getSignedUrl('putObject', params, (err, url) => {
        if (err) {
            console.error('Error generating signed URL:', err);
            return res.status(500).json({ error: 'Failed to generate signed URL' });
        }
        console.log("hello")
        // Send the signed URL back to the client
        res.json({
            signedUrl: url,
            account: account,
            bucket: bucket
        });
    });
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

const awsServerlessExpress = require('aws-serverless-express');
const server = awsServerlessExpress.createServer(app)

module.exports.handler = (event, context) => awsServerlessExpress.proxy(server, event, context);
