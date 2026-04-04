// services/FileStorageService.js
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

class FileStorageService {
    constructor() {
        this.client = new S3Client({
            endpoint: process.env.B2_ENDPOINT,
            region: process.env.B2_REGION,
            credentials: {
                accessKeyId: process.env.B2_APPLICATION_KEY_ID,
                secretAccessKey: process.env.B2_APPLICATION_KEY
            }
        });
        this.bucket = process.env.B2_BUCKET_NAME;
    }

    // 1. Upload a file
    async uploadFile(fileBuffer, key, mimeType) {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            Body: fileBuffer,
            ContentType: mimeType
        });
        await this.client.send(command);
        return key; // Return the object key to store in DB
    }

    // 2. Get a readable stream for private downloads
    async getFileStream(key) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        });
        const response = await this.client.send(command);
        return response.Body; // Returns a readable stream
    }

    // 3. Generate a public signed URL (for 'public_presigned')
    async generatePresignedUrl(key, expiresIn = 3600) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key
        });
        return await getSignedUrl(this.client, command, { expiresIn });
    }

    // 4. Delete a file from B2 (optional - add this method)
    async deleteFile(key) {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key
        });
        await this.client.send(command);
        return true;
    }
}

// Export as default
export default new FileStorageService();