// Path (uploadsDir) is constructed from module directory and config constant, not user input
/* eslint-disable security/detect-non-literal-fs-filename */

import { describe, test, expect, beforeEach, afterAll, vi } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import {
  parseStructuredData,
  findLogoFile,
  findProductImageFile
} from '../../utils/pdfHelpers.js'
import { UPLOADS_DIR } from '../../utils/config.js'

const TEST_UPLOADS_DIR = path.join(process.cwd(), UPLOADS_DIR)

beforeEach(async () => {
  vi.restoreAllMocks()
  await fs.rm(TEST_UPLOADS_DIR, { recursive: true, force: true })
  await fs.mkdir(TEST_UPLOADS_DIR, { recursive: true })
})

afterAll(async () => {
  await fs.rm(TEST_UPLOADS_DIR, { recursive: true, force: true })
})

describe('parseStructuredData', () => {
  describe('basic parsing', () => {
    test('parses header correctly', () => {
      const excelData = [
        ['_header_'],
        ['Test Product Name']
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('Test Product Name')
    })

    test('parses footer correctly', () => {
      const excelData = [
        ['_footer_'],
        ['Footer text here']
      ]

      const result = parseStructuredData(excelData)

      expect(result.footer).toBe('Footer text here')
    })

    test('parses title correctly', () => {
      const excelData = [
        ['_title_'],
        ['Product Data Sheet']
      ]

      const result = parseStructuredData(excelData)

      expect(result.title).toBe('Product Data Sheet')
    })

    test('parses code correctly', () => {
      const excelData = [
        ['_code_'],
        ['ABC-123']
      ]

      const result = parseStructuredData(excelData)

      expect(result.code).toBe('ABC-123')
    })

    test('parses powerSupply correctly', () => {
      const excelData = [
        ['_powerSupply_'],
        ['24V DC']
      ]

      const result = parseStructuredData(excelData)

      expect(result.powerSupply).toBe('24V DC')
    })

    test('handles empty data', () => {
      const result = parseStructuredData([])

      expect(result.header).toBe('')
      expect(result.footer).toBe('')
      expect(result.title).toBe('')
      expect(result.code).toBe('')
      expect(result.powerSupply).toBe('')
      expect(result.sections).toEqual([])
    })

    test('handles undefined cells as empty strings', () => {
      const excelData = [
        ['_header_'],
        [undefined],
        ['_title_'],
        [null]
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('')
      expect(result.title).toBe('')
    })
  })

  describe('list sections', () => {
    test('parses simple list', () => {
      const excelData = [
        ['_list_'],
        ['Feature 1'],
        ['Feature 2'],
        ['Feature 3']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].type).toBe('list')
      expect(result.sections[0].data).toEqual(['Feature 1', 'Feature 2', 'Feature 3'])
      expect(result.sections[0].subtitle).toBe('')
    })

    test('parses list with subtitle', () => {
      const excelData = [
        ['_subtitle_'],
        ['Key Features'],
        ['_list_'],
        ['Feature A'],
        ['Feature B']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].subtitle).toBe('Key Features')
      expect(result.sections[0].data).toEqual(['Feature A', 'Feature B'])
    })

    test('filters out empty list items', () => {
      const excelData = [
        ['_list_'],
        ['Item 1'],
        [''],
        ['   '],
        ['Item 2']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].data).toEqual(['Item 1', 'Item 2'])
    })

    test('parses multiple lists', () => {
      const excelData = [
        ['_subtitle_'],
        ['List 1'],
        ['_list_'],
        ['A'],
        ['B'],
        ['_subtitle_'],
        ['List 2'],
        ['_list_'],
        ['C'],
        ['D']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(2)
      expect(result.sections[0].subtitle).toBe('List 1')
      expect(result.sections[0].data).toEqual(['A', 'B'])
      expect(result.sections[1].subtitle).toBe('List 2')
      expect(result.sections[1].data).toEqual(['C', 'D'])
    })
  })

  describe('invisible table sections', () => {
    test('parses key-value table', () => {
      const excelData = [
        ['_invisible_table_'],
        ['Width', '100mm'],
        ['Height', '200mm'],
        ['Weight', '5kg']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].type).toBe('invisible_table')
      expect(result.sections[0].data).toEqual([
        ['Width', '100mm'],
        ['Height', '200mm'],
        ['Weight', '5kg']
      ])
    })

    test('parses table with subtitle', () => {
      const excelData = [
        ['_subtitle_'],
        ['Specifications'],
        ['_invisible_table_'],
        ['Key', 'Value']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].subtitle).toBe('Specifications')
      expect(result.sections[0].type).toBe('invisible_table')
    })

    test('ignores completely empty rows in table', () => {
      const excelData = [
        ['_invisible_table_'],
        ['Key1', 'Value1'],
        ['', ''],
        ['   ', '   '],
        ['Key2', 'Value2']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].data).toHaveLength(2)
      expect(result.sections[0].data).toEqual([
        ['Key1', 'Value1'],
        ['Key2', 'Value2']
      ])
    })
  })

  describe('zebra table sections', () => {
    test('parses striped table with headers', () => {
      const excelData = [
        ['_zebraTable_'],
        ['Parameter', 'Value', 'Unit'],
        ['Speed', '100', 'km/h'],
        ['Power', '50', 'kW']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].type).toBe('zebra_table')
      expect(result.sections[0].data).toEqual([
        ['Parameter', 'Value', 'Unit'],
        ['Speed', '100', 'km/h'],
        ['Power', '50', 'kW']
      ])
    })

    test('parses table with subtitle', () => {
      const excelData = [
        ['_subtitle_'],
        ['Performance Data'],
        ['_zebraTable_'],
        ['Metric', 'Value'],
        ['RPM', '3000']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].subtitle).toBe('Performance Data')
      expect(result.sections[0].type).toBe('zebra_table')
    })

    test('filters out empty rows from zebra table', () => {
      const excelData = [
        ['_zebraTable_'],
        ['Col1', 'Col2'],
        ['Data1', 'Data2'],
        ['', ''],
        ['Data3', 'Data4']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].data).toHaveLength(3)
    })
  })

  describe('complex documents', () => {
    test('parses document with all section types', () => {
      const excelData = [
        ['_header_'],
        ['Product ABC'],
        ['_title_'],
        ['Data Sheet'],
        ['_code_'],
        ['CODE-123'],
        ['_powerSupply_'],
        ['24V DC'],
        ['_subtitle_'],
        ['Features'],
        ['_list_'],
        ['Feature 1'],
        ['Feature 2'],
        ['_subtitle_'],
        ['Specs'],
        ['_invisible_table_'],
        ['Width', '100mm'],
        ['_subtitle_'],
        ['Performance'],
        ['_zebraTable_'],
        ['Param', 'Value'],
        ['Speed', '100'],
        ['_footer_'],
        ['Copyright 2024']
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('Product ABC')
      expect(result.title).toBe('Data Sheet')
      expect(result.code).toBe('CODE-123')
      expect(result.powerSupply).toBe('24V DC')
      expect(result.footer).toBe('Copyright 2024')
      expect(result.sections).toHaveLength(3)
      expect(result.sections[0].type).toBe('list')
      expect(result.sections[1].type).toBe('invisible_table')
      expect(result.sections[2].type).toBe('zebra_table')
    })

    test('handles sections without subtitles mixed with subtitled sections', () => {
      const excelData = [
        ['_list_'],
        ['Item 1'],
        ['_subtitle_'],
        ['Section Title'],
        ['_list_'],
        ['Item 2']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(2)
      expect(result.sections[0].subtitle).toBe('')
      expect(result.sections[1].subtitle).toBe('Section Title')
    })
  })

  describe('edge cases', () => {
    test('handles malformed tags gracefully', () => {
      const excelData = [
        ['_header'],
        ['Should be ignored'],
        ['header_'],
        ['Also ignored'],
        ['_header_'],
        ['Valid header']
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('Valid header')
    })

    test('handles missing data after tag', () => {
      const excelData = [
        ['_header_']
      ]

      const result = parseStructuredData(excelData)

      expect(result.header).toBe('')
    })

    test('handles tags at end of data', () => {
      const excelData = [
        ['_list_'],
        ['Item 1'],
        ['Item 2']
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections).toHaveLength(1)
      expect(result.sections[0].data).toEqual(['Item 1', 'Item 2'])
    })

    test('converts non-string cells to strings', () => {
      const excelData = [
        ['_list_'],
        [123],
        [true],
        [null],
        [undefined]
      ]

      const result = parseStructuredData(excelData)

      expect(result.sections[0].data).toEqual(['123', 'true'])
    })
  })
})

describe('findLogoFile', () => {
  test('returns undefined when uploads directory does not exist', async () => {
    await fs.rm(TEST_UPLOADS_DIR, { recursive: true, force: true })

    const logoPath = findLogoFile()

    expect(logoPath).toBeUndefined()
  })

  test('returns undefined when no logo file exists', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'test.png'), 'fake png data')
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'image.png'), 'fake png data')

    const logoPath = findLogoFile()

    expect(logoPath).toBeUndefined()
  })

  test('finds logo file with "logo" in filename (case insensitive)', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'company-logo.png'), 'fake png data')

    const logoPath = findLogoFile()

    expect(logoPath).toBeDefined()
    expect(logoPath).toContain('company-logo.png')
  })

  test('finds logo with uppercase in filename', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'LOGO.png'), 'fake png data')

    const logoPath = findLogoFile()

    expect(logoPath).toBeDefined()
    expect(logoPath).toContain('LOGO.png')
  })

  test('ignores non-png logo files', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'logo.jpg'), 'fake jpg data')

    const logoPath = findLogoFile()

    expect(logoPath).toBeUndefined()
  })

  test('finds logo in subdirectory', async () => {
    const subdir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(subdir, { recursive: true })
    await fs.writeFile(path.join(subdir, 'brand-logo.png'), 'fake png data')

    const logoPath = findLogoFile()

    expect(logoPath).toBeDefined()
    expect(logoPath).toContain('brand-logo.png')
  })

  test('returns first logo found when multiple exist', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'logo1.png'), 'fake png data')
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'logo2.png'), 'fake png data')

    const logoPath = findLogoFile()

    expect(logoPath).toBeDefined()
    expect(logoPath).toMatch(/logo[12]\.png/)
  })
})

describe('findProductImageFile', () => {
  test('returns undefined when uploads directory does not exist', async () => {
    await fs.rm(TEST_UPLOADS_DIR, { recursive: true, force: true })

    const imagePath = findProductImageFile('Product Name')

    expect(imagePath).toBeUndefined()
  })

  test('returns undefined when productName is not provided', async () => {
    expect(findProductImageFile(undefined)).toBeUndefined()
    expect(findProductImageFile(null)).toBeUndefined()
    expect(findProductImageFile('')).toBeUndefined()
  })

  test('returns undefined when productName is not a string', async () => {
    expect(findProductImageFile(123)).toBeUndefined()
    expect(findProductImageFile({})).toBeUndefined()
    expect(findProductImageFile([])).toBeUndefined()
  })

  test('returns undefined when no matching image exists', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'other-product.png'), 'fake png')

    const imagePath = findProductImageFile('My Product')

    expect(imagePath).toBeUndefined()
  })

  test('finds product image with matching name', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'MyProduct.png'), 'fake png')

    const imagePath = findProductImageFile('My Product')

    expect(imagePath).toBeDefined()
    expect(imagePath).toContain('MyProduct.png')
  })

  test('matches product name case-insensitively', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'myproduct.png'), 'fake png')

    const imagePath = findProductImageFile('MY PRODUCT')

    expect(imagePath).toBeDefined()
    expect(imagePath).toContain('myproduct.png')
  })

  test('ignores spaces in matching', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'SuperWidget.png'), 'fake png')

    const imagePath = findProductImageFile('Super Widget')

    expect(imagePath).toBeDefined()
    expect(imagePath).toContain('SuperWidget.png')
  })

  test('ignores non-png files', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'Product.jpg'), 'fake jpg')

    const imagePath = findProductImageFile('Product')

    expect(imagePath).toBeUndefined()
  })

  test('finds image in subdirectory', async () => {
    const subdir = path.join(TEST_UPLOADS_DIR, '1')
    await fs.mkdir(subdir, { recursive: true })
    await fs.writeFile(path.join(subdir, 'TestProduct.png'), 'fake png')

    const imagePath = findProductImageFile('Test Product')

    expect(imagePath).toBeDefined()
    expect(imagePath).toContain('TestProduct.png')
  })

  test('matches partial product name', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'WidgetPro2000.png'), 'fake png')

    const imagePath = findProductImageFile('Widget')

    expect(imagePath).toBeDefined()
    expect(imagePath).toContain('WidgetPro2000.png')
  })

  test('handles special characters in filename', async () => {
    await fs.writeFile(path.join(TEST_UPLOADS_DIR, 'Product-Model-X.png'), 'fake png')

    const imagePath = findProductImageFile('Product-Model-X')

    expect(imagePath).toBeDefined()
    expect(imagePath).toContain('Product-Model-X.png')
  })
})
