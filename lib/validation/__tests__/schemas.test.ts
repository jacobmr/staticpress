import { describe, it, expect } from 'vitest'
import {
  publishPostSchema,
  deletePostSchema,
  connectRepoSchema,
  feedbackSchema,
  uploadImageSchema,
} from '../schemas'

describe('publishPostSchema', () => {
  it('accepts valid post data', () => {
    const data = {
      title: 'Test Post',
      content: '<p>Hello world</p>',
      draft: false,
    }

    const result = publishPostSchema.safeParse(data)

    expect(result.success).toBe(true)
  })

  it('rejects empty title', () => {
    const data = {
      title: '',
      content: '<p>Hello world</p>',
    }

    const result = publishPostSchema.safeParse(data)

    expect(result.success).toBe(false)
  })

  it('rejects empty content', () => {
    const data = {
      title: 'Test',
      content: '',
    }

    const result = publishPostSchema.safeParse(data)

    expect(result.success).toBe(false)
  })

  it('defaults draft to false', () => {
    const data = {
      title: 'Test',
      content: 'Content',
    }

    const result = publishPostSchema.safeParse(data)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.draft).toBe(false)
    }
  })

  it('accepts optional path', () => {
    const data = {
      title: 'Test',
      content: 'Content',
      path: 'content/posts/2024/01/test.md',
    }

    const result = publishPostSchema.safeParse(data)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.path).toBe('content/posts/2024/01/test.md')
    }
  })
})

describe('deletePostSchema', () => {
  it('accepts valid delete data', () => {
    const data = {
      path: 'content/posts/test.md',
      sha: 'abc123def456',
    }

    const result = deletePostSchema.safeParse(data)

    expect(result.success).toBe(true)
  })

  it('rejects missing path', () => {
    const data = {
      sha: 'abc123',
    }

    const result = deletePostSchema.safeParse(data)

    expect(result.success).toBe(false)
  })

  it('rejects missing sha', () => {
    const data = {
      path: 'content/posts/test.md',
    }

    const result = deletePostSchema.safeParse(data)

    expect(result.success).toBe(false)
  })
})

describe('connectRepoSchema', () => {
  it('accepts valid repo data', () => {
    const data = {
      owner: 'testuser',
      repo: 'my-blog',
      contentPath: 'content/posts',
      engine: 'hugo',
    }

    const result = connectRepoSchema.safeParse(data)

    expect(result.success).toBe(true)
  })

  it('rejects invalid owner characters', () => {
    const data = {
      owner: 'invalid owner!',
      repo: 'my-blog',
    }

    const result = connectRepoSchema.safeParse(data)

    expect(result.success).toBe(false)
  })

  it('rejects invalid repo characters', () => {
    const data = {
      owner: 'testuser',
      repo: 'invalid repo name!',
    }

    const result = connectRepoSchema.safeParse(data)

    expect(result.success).toBe(false)
  })

  it('defaults engine to hugo', () => {
    const data = {
      owner: 'testuser',
      repo: 'my-blog',
    }

    const result = connectRepoSchema.safeParse(data)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.engine).toBe('hugo')
    }
  })

  it('accepts krems engine', () => {
    const data = {
      owner: 'testuser',
      repo: 'my-blog',
      engine: 'krems',
    }

    const result = connectRepoSchema.safeParse(data)

    expect(result.success).toBe(true)
  })
})

describe('feedbackSchema', () => {
  it('accepts valid feedback', () => {
    const data = {
      type: 'bug',
      message: 'This is a bug report with enough detail to be useful.',
    }

    const result = feedbackSchema.safeParse(data)

    expect(result.success).toBe(true)
  })

  it('rejects message too short', () => {
    const data = {
      type: 'bug',
      message: 'Short',
    }

    const result = feedbackSchema.safeParse(data)

    expect(result.success).toBe(false)
  })

  it('rejects invalid type', () => {
    const data = {
      type: 'invalid',
      message: 'This is a valid message length for testing.',
    }

    const result = feedbackSchema.safeParse(data)

    expect(result.success).toBe(false)
  })
})

describe('uploadImageSchema', () => {
  it('accepts valid image data', () => {
    const data = {
      filename: 'test-image.png',
      content: 'base64encodedcontent',
      contentType: 'image/png',
    }

    const result = uploadImageSchema.safeParse(data)

    expect(result.success).toBe(true)
  })

  it('rejects invalid filename characters', () => {
    const data = {
      filename: 'invalid file name!.png',
      content: 'base64content',
      contentType: 'image/png',
    }

    const result = uploadImageSchema.safeParse(data)

    expect(result.success).toBe(false)
  })

  it('rejects invalid content type', () => {
    const data = {
      filename: 'test.exe',
      content: 'base64content',
      contentType: 'application/x-executable',
    }

    const result = uploadImageSchema.safeParse(data)

    expect(result.success).toBe(false)
  })
})
