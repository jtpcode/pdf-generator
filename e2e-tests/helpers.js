export const createMockExcelFile = (filename, content = 'mock excel file content', fileExtension = 'xlsx') => {
  const mimeTypes = {
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel'
  }

  return {
    name: filename,
    mimeType: mimeTypes[fileExtension] || mimeTypes.xlsx,
    buffer: Buffer.from(content)
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
