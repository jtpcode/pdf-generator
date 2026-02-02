import PDFDocument from 'pdfkit'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const addHeader = (doc, productName = 'Product Name') => {
  doc.fontSize(14)
    .font('DejaVuSans-Bold')
    .fillColor('red')
    .text(productName, 50, 20)
    .fillColor('black')

  doc.fontSize(10)
    .font('DejaVuSans')
    .text('[Logo placeholder]', 50, 20, { align: 'right' })

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

const parseStructuredData = (excelData) => {
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

const renderBulletList = (doc, items) => {
  doc.list(items, {
    bulletRadius: 2,
    textIndent: 20,
    bulletIndent: 10
  })
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

export const generateProductDataSheetPdf = (excelData, outputStream) => {
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
      .text(parsedData.code)
    doc.moveDown(0.2)

    doc.text(parsedData.powerSupply)
    doc.moveDown(0.5)

    parsedData.sections.forEach(section => {
      if (section.subtitle) {
        doc.fontSize(11)
          .font('DejaVuSans-Bold')
          .text(section.subtitle)
        doc.moveDown(0.2)
        doc.fontSize(10)
          .font('DejaVuSans')
      }

      if (section.type === 'list') {
        renderBulletList(doc, section.data)
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
