import express from 'express'
import sharp from 'sharp'
import { eq, desc, sql } from 'drizzle-orm'
import { upload } from '../middleware/upload.js'
import { db } from '../db/db.js'
import { images } from '../db/schema.js'
import { saveFile, getUrl } from '../storage/local.js'
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';

const router = express.Router()

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

router.post('/', upload.array('images', 10), async (req, res) => {

    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = []

    for(const file of req.files){
    try{
        const type = await fileTypeFromBuffer(file.buffer);

        if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
            return res.status(400).json({ error: 'Invalid or unsupported image file' });
            results.push({ originalName: file.originalname, success: false, error: 'Invalid or unsupported image file' });
            continue;
        }

        const metadata = await sharp(file.buffer).metadata() //sharp =>  sharp image processing object, buffer => image bytes, metadata => image info (width, height, format etc) 

        const id = crypto.randomUUID();
        const extension = file.mimetype.split('/')[1]; //image/png => split('/') => ['image', 'png'], [1] => grabs png
        const filename = `${id}.${extension}`; //uuid + png

        await saveFile(file.buffer, filename); //writes buffer to file inside uploads/ folder
        const url = getUrl(filename); // returns string url path /uploads/<filename>

        const [record] = await db.insert(images).values({
            id,
            key: filename,
            url,
            mimetype: file.mimetype,
            size: file.size,
            width: metadata.width,
            height: metadata.height,
            status: 'uploaded',
        }).returning();

        results.push({ originalName: file.originalname, success: true, data: record });

    }catch(error){
        console.error('Upload failed for', file.originalname, error);
        results.push({ originalName: file.originalname, success: false, error: 'Upload failed' });
    }
    }

    const anySucceeded = results.some(r => r.success);
    res.status(anySucceeded ? 201 : 400).json(results);
})

export default router