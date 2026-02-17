import PDFDocument from 'pdfkit'
import path from 'path'
import { fileURLToPath } from 'url'
import { findLogoFile, findProductImageFile, parseStructuredData } from './pdfHelpers.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const addHeader = (doc, productName = 'Product Name') => {
  doc.fontSize(14)
    .font('DejaVuSans-Bold')
    .fillColor('#c91e42')
    .text(productName, 50, 30)
    .fillColor('black')

  const logoPath = findLogoFile()
  if (logoPath) {
    try {
      const logoWidth = 80
      const logoHeight = 30
      const pageWidth = doc.page.width
      const logoX = pageWidth - 50 - logoWidth

      doc.image(logoPath, logoX, 20, {
        width: logoWidth,
        height: logoHeight,
        fit: [logoWidth, logoHeight],
        align: 'right'
      })
    } catch {
      doc.fontSize(10)
        .font('DejaVuSans')
        .text('[Logo placeholder]', 50, 20, { align: 'right' })
    }
  } else {
    doc.fontSize(10)
      .font('DejaVuSans')
      .text('[Logo placeholder]', 50, 20, { align: 'right' })
  }

  doc.moveDown(2)
}

const addFooter = (doc, pageNumber, totalPages, footerText = '') => {
  const footerY = doc.page.height - 40
  const pageWidth = doc.page.width

  doc.fontSize(7)
    .font('DejaVuSans')
    .text(footerText, 20, footerY, {
      align: 'left',
      width: pageWidth - 40
    })
    .text(`Version: ${new Date().toISOString().split('T')[0]}    ` +
      `Page ${pageNumber} of ${totalPages}`, 20, footerY, {
      align: 'right',
      width: pageWidth - 40
    })

  doc.text('Data is subject to change without notice.', 20, footerY + 10, {
    align: 'left',
    width: pageWidth - 40
  })
}

const renderBulletList = (doc, items, options = {}) => {
  const listOptions = {
    bulletRadius: 2,
    textIndent: 20,
    bulletIndent: 10,
    ...options
  }
  doc.list(items, listOptions)
  doc.moveDown(0.3)
}

const renderKeyValueTable = (doc, rows) => {
  const tableData = rows
    .filter(row => row.some(cell => cell && String(cell).trim() !== ''))
    .map(row => [
      String(row[0] ?? ''),
      String(row[1] ?? '')
    ])

  if (tableData.length === 0) return

  doc.table({
    columnStyles: ['*', '*'],
    rowStyles: { border: false, padding: [2, 5] },
    data: tableData
  })
  doc.moveDown(0.3)
}

const renderStripedTable = (doc, dataRows) => {
  if (dataRows.length === 0) return

  const headers = dataRows[0]
  const numCols = headers.filter(h => h && String(h).trim() !== '').length

  const tableData = dataRows.map(row =>
    row.slice(0, numCols).map(cell => {
      if (typeof cell === 'number' && cell > 0 && cell < 1) {
        return `${Math.round(cell * 100)} %`
      }
      return String(cell ?? '')
    })
  )

  doc.fontSize(8)
  doc.table({
    columnStyles: (colIndex) => ({
      width: '*',
      backgroundColor: colIndex % 2 === 0 ? '#e2e2e2' : '#ffffff'
    }),
    rowStyles: (i) => {
      if (i === 0) {
        return {
          font: 'DejaVuSans-Bold',
          padding: [3, 5],
          align: 'center',
          border: [1, 0, 2, 0],
          borderColor: '#000000'
        }
      }
      if (i === tableData.length - 1) {
        return {
          padding: [3, 5],
          align: 'center',
          border: [0, 0, 1, 0],
          borderColor: '#000000'
        }
      }
      return {
        padding: [3, 5],
        align: 'center',
        border: false
      }
    },
    data: tableData
  })
  doc.fontSize(10)
  doc.moveDown(0.3)
}

export const generateProductDataSheetPdfKit = (excelData, outputStream) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margins: {
        top: 0,
        bottom: 0,
        left: 50,
        right: 50
      },
      size: 'A4'
    })

    doc.on('error', reject)
    doc.on('end', resolve)

    doc.pipe(outputStream)

    const fontsDir = path.join(__dirname, '..', 'fonts')
    doc.registerFont('DejaVuSans', path.join(fontsDir, 'DejaVuSans.ttf'))
    doc.registerFont('DejaVuSans-Bold', path.join(fontsDir, 'DejaVuSans-Bold.ttf'))

    const parsedData = parseStructuredData(excelData)

    addHeader(doc, parsedData.header)

    doc.fontSize(14)
      .font('DejaVuSans-Bold')
      .text(parsedData.title)
    doc.moveDown(0.3)

    doc.fontSize(10)
      .font('DejaVuSans')
      .text(parsedData.code, { align: 'right' })
    doc.moveDown(0.2)

    doc.text(parsedData.powerSupply, { align: 'right' })
    doc.moveDown(0.2)

    const productImagePath = findProductImageFile(parsedData.header)
    if (productImagePath) {
      try {
        const imageWidth = 150
        const imageHeight = 150
        const pageWidth = doc.page.width
        const imageX = pageWidth - 50 - imageWidth
        const imageY = doc.y + 10

        doc.image(productImagePath, imageX, imageY, {
          fit: [imageWidth, imageHeight]
        })
      } catch {
        doc.fontSize(10)
          .font('DejaVuSans')
          .text('[Product image placeholder]', doc.x, doc.y)
      }
    }

    doc.moveDown(0.3)

    parsedData.sections.forEach((section, index) => {
      if (section.subtitle) {
        doc.fontSize(11)
          .font('DejaVuSans-Bold')
          .text(section.subtitle)
        doc.moveDown(0.2)
        doc.fontSize(10)
          .font('DejaVuSans')
      }

      if (section.type === 'list') {
        const isFirstList = index === 0
        if (isFirstList) {
          const pageWidth = doc.page.width - 100
          renderBulletList(doc, section.data, { width: pageWidth * 0.6 })
        } else {
          renderBulletList(doc, section.data)
        }
        doc.moveDown(0.3)
      } else if (section.type === 'invisible_table') {
        renderKeyValueTable(doc, section.data)
        doc.moveDown(0.3)
      } else if (section.type === 'zebra_table') {
        renderStripedTable(doc, section.data)
        doc.moveDown(0.3)
      }
    })

    addFooter(doc, 1, 1, parsedData.footer)

    doc.end()
  })
}
