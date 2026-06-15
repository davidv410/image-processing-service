import express from 'express'
import sharp from 'sharp'
import { eq, desc, sql } from 'drizzle-orm'
import { upload } from '../middleware/upload.js'
import { db } from '../db/db.js'
import { images } from '../db/schema.js'
// import { saveFile, getUrl } from '../storage/local.js'
import { saveFile, getFile, getUrl } from '../storage/r2.js'
import crypto from 'crypto';
import { fileTypeFromBuffer } from 'file-type';

const router = express.Router({ mergeParams: true })

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

router.get('/', async (req, res) => {
    const { page } = req.query || 1
    const { limit } = req.query || 2
    const offset = (Number(page) - 1) * Number(limit)

    try{

        const [result, [{count}]] = await Promise.all([
          db.select()
            .from(images)
            .orderBy(desc(images.createdAt))
            .limit(Number(limit))
            .offset(Number(offset)),

          db.select({ count: sql`count(*)::int` })
            .from(images)

        ])

        res.json({ data: result, totalPages: count, page: page, limit: limit })
        
    }catch(error){
        console.log(error)
        res.status(500).json({ error: 'server error' });
    }

})

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

        await saveFile(file.buffer, filename, type.mime); //writes buffer to file inside uploads/ folder
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


router.post('/:id/transform', async (req, res) => {
    const { transformations } = req.body

    if(!transformations || Object.keys(transformations).length === 0){
        return res.status(400).json({ error: 'No transformations provided' });
    }

    try{
        const [original] = await db.select().from(images).where(eq(images.id, req.params.id))

        if(!original){
            return res.status(404).json({ error: 'Image not found' });
        }

        const buffer = await getFile(original.key)
        let pipeline = sharp(buffer)

        if(transformations.rotate){
            pipeline = pipeline.rotate(transformations.rotate);
        }

        if(transformations.crop){
            const { width, height, x, y } = transformations.crop;
            pipeline = pipeline.extract({ left: x, top: y, width, height });
        }

        if(transformations.resize){
            const { width, height } = transformations.resize;
            pipeline = pipeline.resize(width, height);
        }

        if(transformations.filters?.grayscale){
            pipeline = pipeline.grayscale();
        }

        if(transformations.filters?.sepia){
            pipeline = pipeline.recomb([
                [0.393, 0.769, 0.189],
                [0.349, 0.686, 0.168],
                [0.272, 0.534, 0.131],
            ]);
        }

        if(transformations.format){
            pipeline = pipeline.toFormat(transformations.format);
        }

        const outputBuffer = await pipeline.toBuffer()
        const outputMetadata = await sharp(outputBuffer).metadata()
        const type = await fileTypeFromBuffer(outputBuffer)

        const mimetype = type?.mime || original.mimetype
        const extension = type?.ext || outputMetadata.format

        const id = crypto.randomUUID()
        const filename = `${id}.${extension}`

        await saveFile(outputBuffer, filename, mimetype)
        const url = getUrl(filename)

        const [record] = await db.insert(images).values({
            id,
            key: filename,
            url,
            mimetype,
            size: outputBuffer.length,
            width: outputMetadata.width,
            height: outputMetadata.height,
            status: 'uploaded',
            originalImageId: original.id,
        }).returning();

        res.status(201).json(record);

    }catch(error){
        console.log(error)
        res.status(500).json({ error: 'Transform failed' });
    }
})

export default router