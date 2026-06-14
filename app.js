import 'dotenv/config'
import express from 'express'
import images from './routes/images.js'
import path from 'path'
import { fileURLToPath } from 'url'

const app = express()

app.use(express.json())

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/images', images)

app.listen(process.env.PORT || 4000, () => {
    console.log('Server is running')
})