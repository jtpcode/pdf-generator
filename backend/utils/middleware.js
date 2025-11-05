import helmet from 'helmet'
import morgan from 'morgan'
import express from 'express'

// Morgan body-token
morgan.token('body', (req) => {
  if (req.body) {
    const strBody = JSON.stringify(req.body)
    return strBody !== '{}' ? strBody : ' '
  }
  return ' '
})

const jsonParser = express.json()
const staticFiles = express.static('dist')
const logger = morgan(':method :url :status :res[content-length] - :response-time ms :body')

const unknownEndpoint = (req, res) => {
  res.status(404).send({ error: 'Unknown endpoint.' })
}

const errorHandler = (error, req, res, next) => {
  logger.error(error.message)

  // if (error.name === 'CastError') {
  //   return res.status(400).send({ error: 'Malformatted id.' })
  // } else if (error.name === 'ValidationError') {
  //   return res.status(400).json({ error: error.message })
  // } else if (
  //   error.name === 'MongoServerError' &&
  //   error.message.includes('E11000 duplicate key error')
  // ) {
  //   return res
  //     .status(400)
  //     .json({ error: 'Expected `username` to be unique.' })
  // } else if (error.name === 'JsonWebTokenError') {
  //   return res.status(401).json({ error: 'Token missing or invalid.' })
  // } else if (error.name === 'TokenExpiredError') {
  //   return res.status(401).json({
  //     error: 'Token expired.'
  //   })
  // }

  next(error)
}

export { helmet, jsonParser, staticFiles, logger, unknownEndpoint, errorHandler }