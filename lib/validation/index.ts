import { NextResponse } from 'next/server'
import { ZodSchema, ZodError } from 'zod'

export * from './schemas'

/**
 * Validate request body against a Zod schema
 * Returns typed data or error response
 */
export async function validateRequest<T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<{ data: T } | { error: NextResponse }> {
  try {
    const body = await request.json()
    const data = schema.parse(body)
    return { data }
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map((err) => ({
        field: err.path.map(String).join('.'),
        message: err.message,
      }))
      return {
        error: NextResponse.json(
          { error: 'Validation failed', details },
          { status: 400 }
        )
      }
    }
    if (error instanceof SyntaxError) {
      return {
        error: NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 }
        )
      }
    }
    return {
      error: NextResponse.json(
        { error: 'Request validation failed' },
        { status: 400 }
      )
    }
  }
}

/**
 * Validate data directly against a schema (for non-request validation)
 */
export function validateData<T>(
  data: unknown,
  schema: ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const parsed = schema.parse(data)
    return { success: true, data: parsed }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.issues.map((err) =>
        `${err.path.map(String).join('.')}: ${err.message}`
      )
      return { success: false, errors }
    }
    return { success: false, errors: ['Validation failed'] }
  }
}
