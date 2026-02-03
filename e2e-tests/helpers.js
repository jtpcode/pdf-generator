import ExcelJS from 'exceljs'

export const createMockExcelFile = async (filename, data = null, fileExtension = 'xlsx') => {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Sheet1')

  if (data && Array.isArray(data)) {
    data.forEach(row => {
      worksheet.addRow(row)
    })
  } else {
    worksheet.addRow(['Header 1', 'Header 2', 'Header 3'])
    worksheet.addRow(['Data 1', 'Data 2', 'Data 3'])
    worksheet.addRow(['Data 4', 'Data 5', 'Data 6'])
  }

  const buffer = await workbook.xlsx.writeBuffer()

  const mimeTypes = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel'
  }

  return {
    name: filename,
    mimeType: mimeTypes[fileExtension] || mimeTypes.xlsx,
    buffer: Buffer.from(buffer)
  }
}

export const createMockPngFile = (filename = 'test.png') => {
  const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  return {
    name: filename,
    mimeType: 'image/png',
    buffer: Buffer.from(base64Png, 'base64')
  }
}

export const uploadFile = async (page, fileConfig) => {
  await page.setInputFiles('input[type="file"]', fileConfig)
}

export const navigateToRegisterPage = async (page) => {
  await page.goto('http://localhost:5173')
  await page.getByRole('button', { name: /register here/i }).click()
}

export const resetDatabase = async (request) => {
  await request.post('http://localhost:3001/api/testing/resetDb')
}

export const fillRegistrationForm = async (page, { username, name, password, confirmPassword }) => {
  await page.getByLabel(/username/i).fill(username)
  await page.getByLabel(/full name/i).fill(name)
  await page.locator('input[type="password"]').first().fill(password)
  await page.getByLabel(/confirm password/i).fill(confirmPassword || password)
}
