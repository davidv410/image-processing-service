import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads') //__dirname je ovdje u local.js, pa zato moram izac ./(u storage folder), ../ u root di je uploads

export const saveFile = async (buffer, filename) => {
    await fs.mkdir(UPLOAD_DIR, { recursive: true }) //UMJESTO PROVJERAVANJA JEL FOLDER POSTOJI, ISTA SVRHA, AKO NEMA NAPRAVI AKO IMA IDI DALJE
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);
}

export const getUrl = (filename) => {
    return `/uploads/${filename}`
}