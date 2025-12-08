import { PORT } from './utils/config.js'
import app from './app.js'

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
