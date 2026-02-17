// Path (uploadsDir) is constructed from module directory and config constant, not user input
/* eslint-disable security/detect-non-literal-fs-filename */

import { describe, test, expect, beforeEach, afterAll } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { Writable } from 'stream'
import { generateProductDataSheetPdfKit } from '../../utils/pdfGeneratorKit.js'
import { UPLOADS_DIR } from '../../utils/config.js'

const TEST_UPLOADS_DIR = path.join(process.cwd(), UPLOADS_DIR)

beforeEach(async () => {
  await fs.rm(TEST_UPLOADS_DIR, { recursive: true, force: true })
  await fs.mkdir(TEST_UPLOADS_DIR, { recursive: true })
}, 15000)

afterAll(async () => {
  await fs.rm(TEST_UPLOADS_DIR, { recursive: true, force: true })
}, 15000)

describe('generateProductDataSheetPdfKit', () => {
  describe('basic functionality', () => {
    test('generates PDF successfully with valid data', async () => {
      const excelData = [
        ['_header_'],
        ['Test Product'],
        ['_title_'],
        ['Product Data Sheet'],
        ['_list_'],
        ['Feature 1'],
        ['Feature 2']
      ]

      const chunks = []
      const outputStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk)
          callback()
        }
      })

      await generateProductDataSheetPdfKit(excelData, outputStream)

      const pdfBuffer = Buffer.concat(chunks)
      expect(pdfBuffer.length).toBeGreaterThan(0)
      expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF')
    })

    test('generates PDF with empty data', async () => {
      const excelData = []

      const chunks = []
      const outputStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk)
          callback()
        }
      })

      await generateProductDataSheetPdfKit(excelData, outputStream)

      const pdfBuffer = Buffer.concat(chunks)
      expect(pdfBuffer.length).toBeGreaterThan(0)
    })

    test('generates PDF with all section types', async () => {
      const excelData = [
        ['_header_'],
        ['Product Header'],
        ['_title_'],
        ['Main Title'],
        ['_code_'],
        ['CODE-123'],
        ['_powerSupply_'],
        ['24V DC'],
        ['_subtitle_'],
        ['Features'],
        ['_list_'],
        ['Feature A'],
        ['Feature B'],
        ['_subtitle_'],
        ['Specifications'],
        ['_invisible_table_'],
        ['Weight', '5kg'],
        ['Dimensions', '100x200mm'],
        ['_subtitle_'],
        ['Performance'],
        ['_zebraTable_'],
        ['Parameter', 'Value'],
        ['Speed', '100'],
        ['_footer_'],
        ['Company Footer']
      ]

      const chunks = []
      const outputStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk)
          callback()
        }
      })

      await generateProductDataSheetPdfKit(excelData, outputStream)

      const pdfBuffer = Buffer.concat(chunks)
      expect(pdfBuffer.length).toBeGreaterThan(0)
      expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF')
    })
  })

  describe('error handling', () => {
    test('handles malformed data gracefully', async () => {
      const excelData = [
        [null, undefined, ''],
        ['_header_'],
        [{ invalid: 'object' }],
        ['_list_'],
        [123, 456]
      ]

      const chunks = []
      const outputStream = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(chunk)
          callback()
        }
      })

      await generateProductDataSheetPdfKit(excelData, outputStream)

      const pdfBuffer = Buffer.concat(chunks)
      expect(pdfBuffer.length).toBeGreaterThan(0)
    })
  })
})
