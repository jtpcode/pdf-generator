/* eslint-disable security/detect-non-literal-fs-filename */
import puppeteer from 'puppeteer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { parseStructuredData, findLogoFile, findProductImageFile } from './pdfGeneratorKit.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const imageToDataUrl = (imagePath) => {
  if (!imagePath || !fs.existsSync(imagePath)) {
    return null
  }
  try {
    const imageBuffer = fs.readFileSync(imagePath)
    return `data:image/png;base64,${imageBuffer.toString('base64')}`
  } catch {
    return null
  }
}

const renderListHtml = (items, subtitle) => {
  let html = ''
  if (subtitle) {
    html += `<div class="subtitle">${subtitle}</div>\n`
  }
  html += '<ul class="features-list">\n'
  items.forEach(item => {
    html += `  <li>${item}</li>\n`
  })
  html += '</ul>\n'
  return html
}

const renderKeyValueTableHtml = (rows, subtitle) => {
  let html = ''
  if (subtitle) {
    html += `<div class="subtitle">${subtitle}</div>\n`
  }
  html += '<table class="invisible">\n'
  rows.forEach(row => {
    const key = String(row[0] ?? '')
    const value = String(row[1] ?? '')
    if (key.trim() || value.trim()) {
      html += `  <tr><td>${key}</td><td>${value}</td></tr>\n`
    }
  })
  html += '</table>\n'
  return html
}

const renderZebraTableHtml = (dataRows, subtitle) => {
  if (dataRows.length === 0) return ''

  let html = ''
  if (subtitle) {
    html += `<div class="subtitle">${subtitle}</div>\n`
  }

  const headers = dataRows[0]
  const numCols = headers.filter(h => h && String(h).trim() !== '').length
  const bodyRows = dataRows.slice(1)

  html += '<table class="zebra">\n'
  html += '  <thead>\n    <tr>\n'
  headers.slice(0, numCols).forEach(header => {
    html += `      <th>${String(header ?? '')}</th>\n`
  })
  html += '    </tr>\n  </thead>\n'

  html += '  <tbody>\n'
  bodyRows.forEach(row => {
    html += '    <tr>\n'
    row.slice(0, numCols).forEach(cell => {
      let cellValue = cell
      if (typeof cell === 'number' && cell > 0 && cell < 1) {
        cellValue = `${Math.round(cell * 100)} %`
      } else {
        cellValue = String(cell ?? '')
      }
      html += `      <td>${cellValue}</td>\n`
    })
    html += '    </tr>\n'
  })
  html += '  </tbody>\n'
  html += '</table>\n'

  return html
}

export const generateProductDataSheetPdfPuppeteer = async (excelData, outputStream) => {
  let browser = null

  try {
    const parsedData = parseStructuredData(excelData)

    const templatePath = path.join(__dirname, '..', 'templates', 'datasheet.html')
    let htmlTemplate = fs.readFileSync(templatePath, 'utf-8')

    const logoPath = findLogoFile()
    const logoDataUrl = imageToDataUrl(logoPath)
    const logoHtml = logoDataUrl
      ? `<img src="${logoDataUrl}" class="logo" alt="Logo">`
      : '<span style="font-size: 10pt;">[Logo placeholder]</span>'

    const productImagePath = findProductImageFile(parsedData.header)
    const productImageDataUrl = imageToDataUrl(productImagePath)
    const productImageHtml = productImageDataUrl
      ? `<div class="product-image-container"><img src="${productImageDataUrl}" class="product-image" alt="Product"></div>`
      : ''

    let sectionsHtml = ''
    parsedData.sections.forEach(section => {
      if (section.type === 'list') {
        sectionsHtml += '<div class="content-section">\n'
        sectionsHtml += renderListHtml(section.data, section.subtitle)
        sectionsHtml += '</div>\n'
      } else if (section.type === 'invisible_table') {
        sectionsHtml += '<div class="content-section">\n'
        sectionsHtml += renderKeyValueTableHtml(section.data, section.subtitle)
        sectionsHtml += '</div>\n'
      } else if (section.type === 'zebra_table') {
        sectionsHtml += '<div class="content-section">\n'
        sectionsHtml += renderZebraTableHtml(section.data, section.subtitle)
        sectionsHtml += '</div>\n'
      }
    })

    const versionDate = new Date().toISOString().split('T')[0]

    htmlTemplate = htmlTemplate.replace('{{productName}}', parsedData.header || 'Product Name')
    htmlTemplate = htmlTemplate.replace('{{logoImage}}', logoHtml)
    htmlTemplate = htmlTemplate.replace('{{title}}', parsedData.title || '')
    htmlTemplate = htmlTemplate.replace('{{code}}', parsedData.code || '')
    htmlTemplate = htmlTemplate.replace('{{powerSupply}}', parsedData.powerSupply || '')
    htmlTemplate = htmlTemplate.replace('{{productImage}}', productImageHtml)
    htmlTemplate = htmlTemplate.replace('{{sectionsHtml}}', sectionsHtml)
    htmlTemplate = htmlTemplate.replace('{{footerText}}', parsedData.footer || '')
    htmlTemplate = htmlTemplate.replace('{{versionDate}}', versionDate)

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlTemplate, { waitUntil: 'domcontentloaded' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true
    })

    await browser.close()
    browser = null

    outputStream.write(pdfBuffer)
    outputStream.end()

    return new Promise((resolve, reject) => {
      outputStream.on('finish', resolve)
      outputStream.on('error', reject)
    })
  } catch (error) {
    if (browser) {
      await browser.close()
    }
    throw error
  }
}
