#!/usr/bin/env ts-node

/**
 * Script to add featureimage frontmatter to all existing posts
 * that have images but are missing the featureimage field
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { parseHugoPost, generateFrontmatter, extractFirstImageUrl } from '../lib/hugo.js'

const POSTS_DIR = '/Users/jmr/dev/docnotes-hugo/content/posts'

function getAllMarkdownFiles(dir: string): string[] {
  const files: string[] = []

  function traverse(currentDir: string) {
    const items = readdirSync(currentDir)
    for (const item of items) {
      const fullPath = join(currentDir, item)
      const stat = statSync(fullPath)

      if (stat.isDirectory()) {
        traverse(fullPath)
      } else if (item.endsWith('.md')) {
        files.push(fullPath)
      }
    }
  }

  traverse(dir)
  return files
}

function updatePost(filePath: string): boolean {
  const content = readFileSync(filePath, 'utf-8')
  const { frontmatter, content: bodyContent } = parseHugoPost(content)

  // Skip if already has featureimage
  if (frontmatter.featureimage) {
    return false
  }

  // Extract first image URL from content
  const imageUrl = extractFirstImageUrl(bodyContent)

  if (!imageUrl) {
    return false
  }

  // Add featureimage to frontmatter
  const updatedFrontmatter = {
    ...frontmatter,
    featureimage: imageUrl,
  } as Record<string, unknown>

  // Ensure title exists (required by HugoFrontmatter)
  if (!updatedFrontmatter.title) {
    console.warn(`Skipping ${filePath}: no title in frontmatter`)
    return false
  }

  // Generate new frontmatter
  const newFrontmatterBlock = generateFrontmatter(updatedFrontmatter as any)

  // Recreate file with new frontmatter
  const newContent = `${newFrontmatterBlock}\n\n${bodyContent}`

  writeFileSync(filePath, newContent, 'utf-8')
  return true
}

function main() {
  console.log(`Scanning posts in: ${POSTS_DIR}`)

  const markdownFiles = getAllMarkdownFiles(POSTS_DIR)
  console.log(`Found ${markdownFiles.length} markdown files`)

  let updatedCount = 0
  let skippedCount = 0

  for (const file of markdownFiles) {
    const relativePath = file.replace(POSTS_DIR, '')
    try {
      const wasUpdated = updatePost(file)
      if (wasUpdated) {
        console.log(`✓ Updated: ${relativePath}`)
        updatedCount++
      } else {
        skippedCount++
      }
    } catch (error) {
      console.error(`✗ Error processing ${relativePath}:`, error)
    }
  }

  console.log(`\n=== Summary ===`)
  console.log(`Total files: ${markdownFiles.length}`)
  console.log(`Updated: ${updatedCount}`)
  console.log(`Skipped (no image or already has featureimage): ${skippedCount}`)
}

main()
