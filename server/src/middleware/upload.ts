import multer from "multer";

const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain"
]

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize : 20 *1024 *1024},
    fileFilter: (req, file, cb) => allowedTypes.includes(file.mimetype) ? cb(null, true) : cb(null, false)
})

export default upload;