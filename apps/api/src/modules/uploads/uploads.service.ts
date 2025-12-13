import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { randomUUID } from 'crypto';
import util from 'util';
import { MultipartFile } from '@fastify/multipart';

const pump = util.promisify(pipeline);

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function saveFile(file: MultipartFile): Promise<string> {
    const fileExtension = path.extname(file.filename);
    const fileName = `${randomUUID()}${fileExtension}`;
    const filePath = path.join(UPLOAD_DIR, fileName);

    await pipeline(file.file, fs.createWriteStream(filePath));

    // Return the relative URL path
    return `/uploads/${fileName}`;
}
