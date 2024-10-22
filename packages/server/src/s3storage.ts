import { S3Client } from "@bradenmacdonald/s3-lite-client";

// Connecting to a local MinIO server:
const s3client = new S3Client({
    useSSL: false,
    endPoint: import.meta.env["AWS_HOST"] ?? "localhost",
    port: parseInt(import.meta.env["AWS_PORT"] ?? "9000"),
    region: import.meta.env["AWS_REGION"] ?? "us-east-1",
    accessKey: import.meta.env["AWS_ACCESS_KEY_ID"] ?? "accesskey",
    secretKey: import.meta.env["AWS_SECRET_ACCESS_KEY"] ?? "secretkey",
    bucket: import.meta.env["AWS_S3_BUCKET"] ?? "test",
});

export async function s3_upload(data: Uint8Array) {
    // Upload a file:
    const name = crypto.randomUUID()
    await s3client.putObject(name, data);
    return name
}
