import helmet from 'helmet'
import morgan from 'morgan'
import express from 'express'

// Morgan: 'body'-token with password filtering
morgan.token('body', (req) => {
  if (req.body) {
    const safeBody = { ...req.body }
    if (safeBody.password) safeBody.password = '[REDACTED]'
    return JSON.stringify(safeBody)
  }
  return ' '
})

const jsonParser = express.json()
const staticFiles = express.static('dist')
const logger = morgan(':method :url :status :res[content-length] - :response-time ms :body')

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'Unknown endpoint.' })
}

const errorHandler = (error, req, res, _next) => { // eslint-disable-line no-unused-vars
  console.error('Error caught by errorHandler:', error.name, error.message)

  // =============================================================================
  // SEQUELIZE DATABASE ERRORS
  // =============================================================================

  // Sequelize validation errors (model-level validations)
  if (error.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: error.errors[0].message,
      type: 'validation_error'
    })
  }

  // Sequelize unique constraint errors (database-level)
  if (error.name === 'SequelizeUniqueConstraintError') {
    const field = error.errors[0].path
    return res.status(400).json({
      error: `${field} must be unique`,
      type: 'duplicate_error'
    })
  }

  // Sequelize foreign key constraint errors
  if (error.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: 'Invalid reference to related data',
      type: 'foreign_key_error'
    })
  }

  // =============================================================================
  // JWT AUTHENTICATION ERRORS
  // =============================================================================

  // Invalid JWT token
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Token missing or invalid',
      type: 'auth_error'
    })
  }

  // Expired JWT token
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token expired',
      type: 'auth_error'
    })
  }

  // =============================================================================
  // UNHANDLED ERRORS
  // =============================================================================

  console.error('Unhandled error type:', error.name, error)
  res.status(500).json({
    error: 'Internal server error',
    type: 'server_error'
  })
}

export { helmet, jsonParser, staticFiles, logger, unknownEndpoint, errorHandler }