import path from 'path'
import { fileURLToPath } from 'url'
import { promises as fs } from 'fs'
import ExcelJS from 'exceljs'
import { File } from '../models/index.js'
import { UPLOADS_DIR } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '..', UPLOADS_DIR)

export const initializeUploadsDir = async () => {
  // SAFE: UPLOADS_DIR is controlled via config and not user input
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  await fs.mkdir(uploadsDir, { recursive: true })
}

export const getUserUploadDir = (userId) => {
  return path.join(uploadsDir, String(userId))
}

export const isValidFilename = (filename) => {
  if (!filename || filename.trim().length === 0) {
    return false
  }

  const dangerousPatterns = [
    /\.\./,     // Parent directory traversal
    /\//,       // Unix path separator
    /\\/,       // Windows path separator
    /\0/,       // Null byte
    /^\.+$/     // Only dots (., .., ...)
  ]

  return !dangerousPatterns.some(pattern => pattern.test(filename))
}

export const validateAndParseExcel = async (req, res) => {
  const fileId = parseInt(req.params.id)

  if (isNaN(fileId)) {
    res.status(400).json({ error: 'Invalid file ID' })
    return null
  }

  const file = await File.findByPk(fileId)

  if (!file) {
    res.status(404).json({ error: 'File not found' })
    return null
  }

  if (file.userId !== req.user.id) {
    res.status(403).json({ error: 'Access denied' })
    return null
  }

  const filePath = path.resolve(file.filePath)
  const userDir = getUserUploadDir(req.user.id)

  if (!filePath.startsWith(path.resolve(userDir))) {
    res.status(400).json({ error: 'Invalid file path' })
    return null
  }

  let excelData = []
  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.readFile(filePath)

    const worksheet = workbook.worksheets[0]

    if (!worksheet) {
      res.status(400).json({ error: 'Excel file contains no worksheets' })
      return null
    }

    worksheet.eachRow((row) => {
      excelData.push(row.values.slice(1))
    })
  } catch {
    res.status(400).json({ error: 'Failed to parse Excel file. File may be corrupted.' })
    return null
  }

  return excelData
}
