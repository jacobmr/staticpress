export interface PostData {
  title: string;
  date: string;
  draft: boolean;
  content: string;
  featuredImage?: string;
  tags?: string[];
  categories?: string[];
  author?: string;
  summary?: string;
  /** Existing frontmatter to preserve when updating posts */
  existingFrontmatter?: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ThemeProfile {
  id: string;
  name: string;
  repo: string;
  description: string;

  // Frontmatter configuration
  frontmatter: {
    featuredImageField: string | null;
    featuredImageIsNested: boolean;
    authorField: string | null;
    summaryField: string | null;
  };

  // Config requirements
  config: {
    paramsTemplate: string;
    requiredSections: string[];
  };

  // Functions
  generateFrontmatter: (data: PostData) => string;
  validateConfig: (config: string) => ValidationResult;
  getDefaultConfig: (blogName?: string, baseURL?: string) => string;
}

/**
 * Helper to escape YAML string values
 */
export function escapeYaml(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Fields managed by StaticPress that should override existing frontmatter
 */
export const MANAGED_FIELDS = [
  "title",
  "date",
  "draft",
  // Theme-specific image fields - will be set by profiles
  "cover",
  "featured_image",
  "featureimage",
  // Theme-specific author fields
  "author",
  "authors",
  // Theme-specific summary fields
  "summary",
  "description",
];

/**
 * All known featured image field names across themes.
 * When a theme sets its own image field, other themes' fields should be removed
 * to prevent stale/conflicting frontmatter from a previous theme profile.
 */
const ALL_IMAGE_FIELDS = ["cover", "featured_image", "featureimage"];

/**
 * Merge existing frontmatter with new managed fields.
 * Preserves unknown fields from existing frontmatter.
 * Removes image fields from other themes to prevent conflicts.
 */
export function mergeExistingFrontmatter(
  managedFields: Record<string, unknown>,
  existingFrontmatter?: Record<string, unknown>,
): Record<string, unknown> {
  if (!existingFrontmatter) {
    return managedFields;
  }

  // Start with existing frontmatter
  const merged = { ...existingFrontmatter };

  // Remove all image fields first, then let managed fields set the correct one.
  // This prevents stale image fields from a different theme profile persisting.
  for (const field of ALL_IMAGE_FIELDS) {
    if (field in merged && !(field in managedFields)) {
      delete merged[field];
    }
  }

  // Override with managed fields (remove undefined values)
  for (const [key, value] of Object.entries(managedFields)) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }

  return merged;
}
