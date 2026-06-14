import multer from 'multer'

export const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, //10mb
    fileFilter: (req, file, cb) => {
        if(!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed'))
        }
        cb(null, true)
    }
}) 

// What it checks: not the file extension (.jpg, .png), 
// but the mimetype — the Content-Type value the client 
// declares for that file part in the multipart body (e.g., image/jpeg). 
// Your fileFilter checks file.mimetype.startsWith('image/'),
//  which is reading that declared value, not inspecting the filename string or the actual bytes.

// "Streaming" refers to processing data as these chunks arrive, rather than waiting for the entire thing to show up first.
// "Buffering" means taking those incoming chunks and accumulating them somewhere — in this case, in memory — until you have the complete file.

// OVO JE ZAPRAVO req.file.buffer