type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  userId?: number | string
  action?: string
  error?: string
  [key: string]: unknown
}

class Logger {
  private isDev = process.env.NODE_ENV === 'development'

  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()
    const logEntry: Record<string, unknown> = {
      timestamp,
      level,
      message,
      ...context,
    }

    // Remove sensitive data
    if ('accessToken' in logEntry) delete logEntry.accessToken
    if ('password' in logEntry) delete logEntry.password
    if ('secret' in logEntry) delete logEntry.secret

    // In production, output structured JSON
    // In development, more readable format
    if (this.isDev) {
      const contextStr = context ? ` ${JSON.stringify(context)}` : ''
      if (level === 'error') {
        console.error(`[${level.toUpperCase()}] ${message}${contextStr}`)
      } else if (level === 'warn') {
        console.warn(`[${level.toUpperCase()}] ${message}${contextStr}`)
      } else {
        console.log(`[${level.toUpperCase()}] ${message}${contextStr}`)
      }
    } else {
      // Production: structured JSON logging
      if (level === 'error') {
        console.error(JSON.stringify(logEntry))
      } else if (level === 'warn' || level === 'info') {
        console.log(JSON.stringify(logEntry))
      }
      // Skip debug in production
    }

    // TODO: Add Sentry integration
    // if (level === 'error' && !this.isDev && process.env.NEXT_PUBLIC_SENTRY_DSN) {
    //   Sentry.captureException(new Error(message), { extra: context })
    // }
  }

  debug(message: string, context?: LogContext) {
    this.log('debug', message, context)
  }

  info(message: string, context?: LogContext) {
    this.log('info', message, context)
  }

  warn(message: string, context?: LogContext) {
    this.log('warn', message, context)
  }

  error(message: string, context?: LogContext) {
    this.log('error', message, context)
  }
}

export const logger = new Logger()
