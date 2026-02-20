import authService from './authService'

const baseUrl = '/api/files'

const getAuthHeaders = () => {
  const token = authService.getToken()
  return {
    'Authorization': `Bearer ${token}`
  }
}

const getAllFiles = async () => {
  const response = await fetch(baseUrl, {
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    let errorMessage = 'Failed to fetch files'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      errorMessage = `${errorMessage} (${response.status})`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

const uploadFile = async (file) => {
  if (!file) {
    throw new Error('No file provided')
  }

  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  })

  if (!response.ok) {
    let errorMessage = 'Failed to upload file'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      errorMessage = `${errorMessage} (${response.status})`
    }
    throw new Error(errorMessage)
  }

  return response.json()
}

const deleteFile = async (fileId) => {
  const response = await fetch(`${baseUrl}/${fileId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    let errorMessage = 'Failed to delete file'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      errorMessage = `${errorMessage} (${response.status})`
    }
    throw new Error(errorMessage)
  }
}

const generatePdf = async (fileId, usePuppeteer = false) => {
  const endpoint = usePuppeteer ? 'pdf-puppeteer' : 'pdf-kit'
  const response = await fetch(`${baseUrl}/${fileId}/${endpoint}`, {
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    let errorMessage = 'Failed to generate PDF'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      errorMessage = `${errorMessage} (${response.status})`
    }
    throw new Error(errorMessage)
  }

  return await response.blob()
}

const getHtmlPreview = async (fileId) => {
  const response = await fetch(`${baseUrl}/${fileId}/html-preview`, {
    headers: getAuthHeaders()
  })

  if (!response.ok) {
    let errorMessage = 'Failed to generate HTML preview'
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch {
      errorMessage = `${errorMessage} (${response.status})`
    }
    throw new Error(errorMessage)
  }

  return await response.text()
}

export default { getAllFiles, uploadFile, deleteFile, generatePdf, getHtmlPreview }