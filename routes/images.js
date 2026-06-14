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

router.post('/', upload.single('image'), async (req, res) => {
    if(!req.file){
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try{
        const type = await fileTypeFromBuffer(req.file.buffer);

        if (!type || !ALLOWED_MIME_TYPES.includes(type.mime)) {
            return res.status(400).json({ error: 'Invalid or unsupported image file' });
        }
        
        const metadata = await sharp(req.file.buffer).metadata() //sharp =>  sharp image processing object, buffer => image bytes, metadata => image info (width, height, format etc) 

        const id = crypto.randomUUID();
        const extension = req.file.mimetype.split('/')[1]; //image/png => split('/') => ['image', 'png'], [1] => grabs png
        const filename = `${id}.${extension}`; //uuid + png

        await saveFile(req.file.buffer, filename); //writes buffer to file inside uploads/ folder
        const url = getUrl(filename); // returns string url path /uploads/<filename>

        const [record] = await db.insert(images).values({
            id,
            key: filename,
            url,
            mimetype: req.file.mimetype,
            size: req.file.size,
            width: metadata.width,
            height: metadata.height,
            status: 'uploaded',
        }).returning();

        res.status(201).json(record);

    }catch(error){
        console.log('Upload failed:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
})

export default router