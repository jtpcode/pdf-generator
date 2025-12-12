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
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to fetch files')
  }

  return response.json()
}

const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData
  })

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || 'Failed to upload file')
  }

  return response.json()
}

export default { getAllFiles, uploadFile }