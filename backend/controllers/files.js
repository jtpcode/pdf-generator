import express from 'express'
import multer from 'multer'
import path from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { File } from '../models/index.js'
import { tokenExtractor } from '../utils/middleware.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const router = express.Router()

// Create uploads directory relative to this file
// controllers/files.js -> backend/uploads/
const uploadsDir = path.join(__dirname, '..', 'uploads')
await fs.mkdir(uploadsDir, { recursive: true })

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + '-' + file.originalname)
  }
})

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only Excel files (.xls, .xlsx) are allowed'))
    }
  }
})

// GET all files for the authenticated user
router.get('/', tokenExtractor, async (req, res) => {
  const files = await File.findAll({
    where: { userId: req.user.id },
    attributes: ['id', 'originalName', 'fileSize', 'createdAt'],
    order: [['createdAt', 'DESC']]
  })

  res.json(files)
})

// POST upload a new file
router.post('/', tokenExtractor, upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }

  // Validate file path for security
  const filePath = path.resolve(req.file.path)
  if (!filePath.startsWith(path.resolve(uploadsDir))) {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.unlink(req.file.path).catch(() => {})
    return res.status(400).json({ error: 'Invalid file path' })
  }

  const file = await File.create({
    filename: req.file.filename,
    originalName: req.file.originalname,
    filePath: req.file.path,
    mimeType: req.file.mimetype,
    fileSize: req.file.size,
    userId: req.user.id
  }).catch(async (error) => {
    // Clean up uploaded file if database insert fails
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    await fs.unlink(req.file.path).catch(() => {})
    throw error
  })

  res.status(201).json({
    id: file.id,
    originalName: file.originalName,
    fileSize: file.fileSize,
    createdAt: file.createdAt
  })
})

export default router