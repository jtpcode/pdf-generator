// Path (uploadsDir) is constructed from module directory and config constant, not user input
/* eslint-disable security/detect-non-literal-fs-filename */

import { describe, test, expect, beforeEach, afterAll, vi } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import { Writable } from 'stream'
import {
  generateProductDataSheetPdfKit,
  parseStructuredData,
  findLogoFile,
  findProductImageFile
} from '../../utils/pdfGeneratorKit.js'
import { UPLOADS_DIR } from '../../utils/config.js'

const TEST_UPLOADS_DIR = path.join(process.cwd(), UPLOADS_DIR)

beforeEach(async () => {
  vi.restoreAllMocks()
  await fs.rm(TEST_UPLOADS_DIR, { recursive: true, force: true })
  await fs.mkdir(TEST_UPLOADS_DIR, { recursive: true })
}, 15000)

afterAll(async () => {
  await fs.rm(TEST_UPLOADS_DIR, { recursive: true, force: true })
}, 15000)

describe('parseStructuredData', () => {
  describe('basic tag parsing', () => {
    test('parses _header_ tag correctly', () => {
      const excelData = [
        ['_header_'],
        ['My Product Header']
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('My Product Header')
      expect(result.title).toBe('')
      expect(result.footer).toBe('')
    })

    test('parses _footer_ tag correctly', () => {
      const excelData = [
        ['_footer_'],
        ['Company Footer Text']
      ]

      const result = parseStructuredData(excelData)

      expect(result.footer).toBe('Company Footer Text')
      expect(result.header).toBe('')
    })

    test('parses _title_ tag correctly', () => {
      const excelData = [
        ['_title_'],
        ['Product Title']
      ]

      const result = parseStructuredData(excelData)

      expect(result.title).toBe('Product Title')
    })

    test('parses _code_ tag correctly', () => {
      const excelData = [
        ['_code_'],
        ['ABC-123-XYZ']
      ]

      const result = parseStructuredData(excelData)

      expect(result.code).toBe('ABC-123-XYZ')
    })

    test('parses _powerSupply_ tag correctly', () => {
      const excelData = [
        ['_powerSupply_'],
        ['24V DC']
      ]

      const result = parseStructuredData(excelData)

      expect(result.powerSupply).toBe('24V DC')
    })

    test('parses all metadata tags together', () => {
      const excelData = [
        ['_header_'],
        ['Header Text'],
        ['_title_'],
        ['Title Text'],
        ['_code_'],
        ['CODE-001'],
        ['_powerSupply_'],
        ['12V AC'],
        ['_footer_'],
        ['Footer Text']
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('Header Text')
      expect(result.title).toBe('Title Text')
      expect(result.code).toBe('CODE-001')
      expect(result.powerSupply).toBe('12V AC')
      expect(result.footer).toBe('Footer Text')
    })
  })

  describe('list parsing', () => {
    test('parses simple list correctly', () => {
      const excelData = [
        ['_list_'],
        ['Item 1'],
        ['Item 2'],
        ['Item 3']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].type).toBe('list')
      expect(result.sections[0].data).toEqual(['Item 1', 'Item 2', 'Item 3'])
      expect(result.sections[0].subtitle).toBe('')
    })

    test('parses list with subtitle', () => {
      const excelData = [
        ['_subtitle_'],
        ['Features'],
        ['_list_'],
        ['Feature A'],
        ['Feature B']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].type).toBe('list')
      expect(result.sections[0].subtitle).toBe('Features')
      expect(result.sections[0].data).toEqual(['Feature A', 'Feature B'])
    })

    test('skips empty lines in list', () => {
      const excelData = [
        ['_list_'],
        ['Item 1'],
        [''],
        ['  '],
        ['Item 2']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].data).toEqual(['Item 1', 'Item 2'])
    })

    test('handles multiple lists', () => {
      const excelData = [
        ['_subtitle_'],
        ['First List'],
        ['_list_'],
        ['Item A'],
        ['_subtitle_'],
        ['Second List'],
        ['_list_'],
        ['Item B']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(2)
      expect(result.sections[0].subtitle).toBe('First List')
      expect(result.sections[0].data).toEqual(['Item A'])
      expect(result.sections[1].subtitle).toBe('Second List')
      expect(result.sections[1].data).toEqual(['Item B'])
    })
  })

  describe('invisible table parsing', () => {
    test('parses basic invisible table', () => {
      const excelData = [
        ['_invisible_table_'],
        ['Key1', 'Value1'],
        ['Key2', 'Value2']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].type).toBe('invisible_table')
      expect(result.sections[0].data).toEqual([
        ['Key1', 'Value1'],
        ['Key2', 'Value2']
      ])
    })

    test('parses invisible table with subtitle', () => {
      const excelData = [
        ['_subtitle_'],
        ['Specifications'],
        ['_invisible_table_'],
        ['Width', '100mm'],
        ['Height', '200mm']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].subtitle).toBe('Specifications')
      expect(result.sections[0].data).toEqual([
        ['Width', '100mm'],
        ['Height', '200mm']
      ])
    })

    test('skips completely empty rows in invisible table', () => {
      const excelData = [
        ['_invisible_table_'],
        ['Key1', 'Value1'],
        ['', ''],
        ['Key2', 'Value2']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].data).toEqual([
        ['Key1', 'Value1'],
        ['Key2', 'Value2']
      ])
    })

    test('keeps rows with any non-empty cell', () => {
      const excelData = [
        ['_invisible_table_'],
        ['Key1', ''],
        ['', 'Value2']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].data).toHaveLength(2)
    })
  })

  describe('zebra table parsing', () => {
    test('parses basic zebra table', () => {
      const excelData = [
        ['_zebraTable_'],
        ['Header1', 'Header2', 'Header3'],
        ['Row1Col1', 'Row1Col2', 'Row1Col3'],
        ['Row2Col1', 'Row2Col2', 'Row2Col3']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].type).toBe('zebra_table')
      expect(result.sections[0].data).toEqual([
        ['Header1', 'Header2', 'Header3'],
        ['Row1Col1', 'Row1Col2', 'Row1Col3'],
        ['Row2Col1', 'Row2Col2', 'Row2Col3']
      ])
    })

    test('parses zebra table with subtitle', () => {
      const excelData = [
        ['_subtitle_'],
        ['Performance Data'],
        ['_zebraTable_'],
        ['Parameter', 'Value'],
        ['Speed', '100 km/h']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].subtitle).toBe('Performance Data')
      expect(result.sections[0].type).toBe('zebra_table')
    })

    test('skips empty rows in zebra table', () => {
      const excelData = [
        ['_zebraTable_'],
        ['Header1', 'Header2'],
        ['Row1', 'Data1'],
        ['', ''],
        ['Row2', 'Data2']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].data).toEqual([
        ['Header1', 'Header2'],
        ['Row1', 'Data1'],
        ['Row2', 'Data2']
      ])
    })
  })

  describe('mixed sections', () => {
    test('handles multiple section types in order', () => {
      const excelData = [
        ['_header_'],
        ['Product X'],
        ['_subtitle_'],
        ['Features'],
        ['_list_'],
        ['Feature A'],
        ['Feature B'],
        ['_subtitle_'],
        ['Specs'],
        ['_invisible_table_'],
        ['Weight', '5kg'],
        ['_subtitle_'],
        ['Performance'],
        ['_zebraTable_'],
        ['Metric', 'Value'],
        ['Speed', '100']
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('Product X')
      expect(result.sections).toHaveLength(3)
      expect(result.sections[0].type).toBe('list')
      expect(result.sections[0].subtitle).toBe('Features')
      expect(result.sections[1].type).toBe('invisible_table')
      expect(result.sections[1].subtitle).toBe('Specs')
      expect(result.sections[2].type).toBe('zebra_table')
      expect(result.sections[2].subtitle).toBe('Performance')
    })

    test('clears subtitle between sections', () => {
      const excelData = [
        ['_subtitle_'],
        ['First Section'],
        ['_list_'],
        ['Item'],
        ['_list_'],
        ['Another Item']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(2)
      expect(result.sections[0].subtitle).toBe('First Section')
      expect(result.sections[1].subtitle).toBe('')
    })
  })

  describe('edge cases', () => {
    test('handles empty excel data', () => {
      const result = parseStructuredData([])

      expect(result.header).toBe('')
      expect(result.footer).toBe('')
      expect(result.title).toBe('')
      expect(result.code).toBe('')
      expect(result.powerSupply).toBe('')
      expect(result.sections).toEqual([])
    })

    test('handles null and undefined cells', () => {
      const excelData = [
        ['_header_'],
        [null],
        ['_title_'],
        [undefined],
        ['_list_'],
        [null],
        ['Valid Item']
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('')
      expect(result.title).toBe('')
      expect(result.sections[0].data).toEqual(['Valid Item'])
    })

    test('handles rows with missing tag values', () => {
      const excelData = [
        ['_header_'],
        ['_title_']
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('_title_')
      expect(result.title).toBe('')
    })

    test('handles tag at end of data without value', () => {
      const excelData = [
        ['_header_'],
        ['Header'],
        ['_footer_']
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('Header')
      expect(result.footer).toBe('')
    })

    test('handles non-string cell values', () => {
      const excelData = [
        ['_header_'],
        [12345],
        ['_code_'],
        [true]
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe(12345)
      expect(result.code).toBe(true)
    })
  })
})

describe('findLogoFile', () => {
  test('returns undefined when uploads directory does not exist', () => {
    const result = findLogoFile()
    expect(result).toBeUndefined()
  })

  test('finds logo.png in uploads directory', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'logo.png'), 'fake image data')

    const result = findLogoFile()

    expect(result).toBeDefined()
    expect(result).toContain('logo.png')
  })

  test('finds logo file with uppercase name', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'LOGO.PNG'), 'fake image data')

    const result = findLogoFile()

    expect(result).toBeDefined()
    expect(result.toLowerCase()).toContain('logo.png')
  })

  test('finds logo file with mixed case', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'Company_Logo.png'), 'fake image data')

    const result = findLogoFile()

    expect(result).toBeDefined()
    expect(result.toLowerCase()).toContain('logo')
  })

  test('returns undefined when no logo file exists', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'image.png'), 'fake image data')

    const result = findLogoFile()

    expect(result).toBeUndefined()
  })

  test('only matches .png files', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'logo.jpg'), 'fake image data')

    const result = findLogoFile()

    expect(result).toBeUndefined()
  })

  test('finds logo in nested subdirectories', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1', 'images', 'branding')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'company-logo.png'), 'fake image data')

    const result = findLogoFile()

    expect(result).toBeDefined()
    expect(result).toContain('company-logo.png')
  })
})

describe('findProductImageFile', () => {
  test('returns undefined when productName is null', () => {
    const result = findProductImageFile(null)
    expect(result).toBeUndefined()
  })

  test('returns undefined when productName is undefined', () => {
    const result = findProductImageFile(undefined)
    expect(result).toBeUndefined()
  })

  test('returns undefined when productName is empty string', () => {
    const result = findProductImageFile('')
    expect(result).toBeUndefined()
  })

  test('returns undefined when uploads directory does not exist', () => {
    const result = findProductImageFile('Product X')
    expect(result).toBeUndefined()
  })

  test('finds product image with exact name match', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'ProductX.png'), 'fake image data')

    const result = findProductImageFile('ProductX')

    expect(result).toBeDefined()
    expect(result).toContain('ProductX.png')
  })

  test('finds product image case-insensitively', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'productx.png'), 'fake image data')

    const result = findProductImageFile('PRODUCTX')

    expect(result).toBeDefined()
    expect(result).toContain('productx.png')
  })

  test('finds product image ignoring whitespace', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'ProductX.png'), 'fake image data')

    const result = findProductImageFile('Product X')

    expect(result).toBeDefined()
    expect(result).toContain('ProductX.png')
  })

  test('finds product image when filename has extra spaces', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'Product X.png'), 'fake image data')

    const result = findProductImageFile('ProductX')

    expect(result).toBeDefined()
    expect(result).toContain('Product X.png')
  })

  test('finds product image with partial name match', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'ProductX-Premium-Edition.png'), 'fake image data')

    const result = findProductImageFile('ProductX')

    expect(result).toBeDefined()
    expect(result).toContain('ProductX-Premium-Edition.png')
  })

  test('only matches .png files', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'ProductX.jpg'), 'fake image data')

    const result = findProductImageFile('ProductX')

    expect(result).toBeUndefined()
  })

  test('returns undefined when no matching product image exists', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'ProductY.png'), 'fake image data')

    const result = findProductImageFile('ProductX')

    expect(result).toBeUndefined()
  })

  test('finds product image in nested subdirectories', async () => {
    const testDir = path.join(TEST_UPLOADS_DIR, '1', 'products', 'images')
    await fs.mkdir(testDir, { recursive: true })
    await fs.writeFile(path.join(testDir, 'ProductX.png'), 'fake image data')

    const result = findProductImageFile('ProductX')

    expect(result).toBeDefined()
    expect(result).toContain('ProductX.png')
  })
})

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
