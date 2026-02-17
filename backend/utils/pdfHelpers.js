// All file paths constructed from __dirname and UPLOADS_DIR constant, safely restricted to uploads directory
/* eslint-disable security/detect-non-literal-fs-filename */
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { UPLOADS_DIR } from './config.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const findLogoFile = () => {
  const uploadsDir = path.join(__dirname, '..', UPLOADS_DIR)
  if (!fs.existsSync(uploadsDir)) {
    return undefined
  }

  const files = fs.readdirSync(uploadsDir, { recursive: true })
  const logoFile = files.find(file =>
    typeof file === 'string' &&
    file.toLowerCase().includes('logo') &&
    file.toLowerCase().endsWith('.png')
  )

  return logoFile ? path.join(uploadsDir, logoFile) : undefined
}

export const findProductImageFile = (productName) => {
  if (!productName || typeof productName !== 'string') {
    return undefined
  }

  const uploadsDir = path.join(__dirname, '..', UPLOADS_DIR)
  if (!fs.existsSync(uploadsDir)) {
    return undefined
  }

  const cleanProductName = productName.toLowerCase().replace(/\s+/g, '')
  const files = fs.readdirSync(uploadsDir, { recursive: true })
  const productImageFile = files.find(file =>
    typeof file === 'string' &&
    file.toLowerCase().replace(/\s+/g, '').includes(cleanProductName) &&
    file.toLowerCase().endsWith('.png')
  )

  return productImageFile ? path.join(uploadsDir, productImageFile) : undefined
}

export const parseStructuredData = (excelData) => {
  const result = {
    header: '',
    footer: '',
    title: '',
    code: '',
    powerSupply: '',
    sections: []
  }

  let currentTag = null
  let currentData = []
  let currentSubtitle = ''

  for (let i = 0; i < excelData.length; i++) {
    // SAFE: excelData comes from validated Excel file parsed by ExcelJS library
    // Data is only used for PDF text rendering, not for code execution
    // eslint-disable-next-line security/detect-object-injection
    const row = excelData[i]
    const firstCell = String(row[0] ?? '')

    if (firstCell.startsWith('_') && firstCell.endsWith('_')) {
      if (currentTag === '_list_' && currentData.length > 0) {
        result.sections.push({
          type: 'list',
          subtitle: currentSubtitle,
          data: currentData
        })
        currentData = []
        currentSubtitle = ''
      } else if (currentTag === '_invisible_table_' && currentData.length > 0) {
        result.sections.push({
          type: 'invisible_table',
          subtitle: currentSubtitle,
          data: currentData
        })
        currentData = []
        currentSubtitle = ''
      } else if (currentTag === '_zebraTable_' && currentData.length > 0) {
        result.sections.push({
          type: 'zebra_table',
          subtitle: currentSubtitle,
          data: currentData
        })
        currentData = []
        currentSubtitle = ''
      }

      currentTag = firstCell

      if (currentTag === '_header_' && i + 1 < excelData.length) {
        result.header = excelData[i + 1][0] ?? ''
        i++
      } else if (currentTag === '_footer_' && i + 1 < excelData.length) {
        result.footer = excelData[i + 1][0] ?? ''
        i++
      } else if (currentTag === '_title_' && i + 1 < excelData.length) {
        result.title = excelData[i + 1][0] ?? ''
        i++
      } else if (currentTag === '_code_' && i + 1 < excelData.length) {
        result.code = excelData[i + 1][0] ?? ''
        i++
      } else if (currentTag === '_powerSupply_' && i + 1 < excelData.length) {
        result.powerSupply = excelData[i + 1][0] ?? ''
        i++
      } else if (currentTag === '_subtitle_' && i + 1 < excelData.length) {
        currentSubtitle = excelData[i + 1][0] ?? ''
        i++
      }
    } else if (currentTag === '_list_' && firstCell && firstCell.trim() !== '') {
      currentData.push(firstCell)
    } else if (currentTag === '_invisible_table_') {
      const hasContent = row.some(cell => cell && String(cell).trim() !== '')
      if (hasContent) {
        currentData.push(row)
      }
    } else if (currentTag === '_zebraTable_') {
      const hasContent = row.some(cell => cell && String(cell).trim() !== '')
      if (hasContent) {
        currentData.push(row)
      }
    }
  }

  if (currentTag === '_list_' && currentData.length > 0) {
    result.sections.push({
      type: 'list',
      subtitle: currentSubtitle,
      data: currentData
    })
  } else if (currentTag === '_invisible_table_' && currentData.length > 0) {
    result.sections.push({
      type: 'invisible_table',
      subtitle: currentSubtitle,
      data: currentData
    })
  } else if (currentTag === '_zebraTable_' && currentData.length > 0) {
    result.sections.push({
      type: 'zebra_table',
      subtitle: currentSubtitle,
      data: currentData
    })
  }

  return result
}
