import yaml from "js-yaml";
import {
  ThemeProfile,
  PostData,
  escapeYaml,
  mergeExistingFrontmatter,
} from "./types";

export const anankeProfile: ThemeProfile = {
  id: "ananke",
  name: "Ananke",
  repo: "https://github.com/theNewDynamic/gohugo-theme-ananke.git",
  description:
    "Clean and simple. Official Hugo starter theme with great defaults.",

  frontmatter: {
    featuredImageField: "featured_image",
    featuredImageIsNested: false,
    authorField: null, // Ananke uses global author in config
    summaryField: "description",
  },

  config: {
    paramsTemplate: `[params]
  author = "StaticPress User"
  show_reading_time = false
  mainSections = ["posts"]`,
    requiredSections: ["markup.goldmark.renderer"],
  },

  generateFrontmatter: (data: PostData): string => {
    // Build managed fields with Ananke-specific structure
    const managedFields: Record<string, unknown> = {
      title: data.title,
      date: data.date,
      draft: data.draft,
    };

    if (data.summary) {
      managedFields.description = data.summary;
    }

    if (data.featuredImage) {
      managedFields.featured_image = data.featuredImage;
    }

    if (data.tags && data.tags.length > 0) {
      managedFields.tags = data.tags;
    }

    if (data.categories && data.categories.length > 0) {
      managedFields.categories = data.categories;
    }

    // Merge with existing frontmatter to preserve unknown fields
    const merged = mergeExistingFrontmatter(
      managedFields,
      data.existingFrontmatter,
    );

    // Use js-yaml for proper serialization
    const yamlContent = yaml.dump(merged, {
      quotingType: '"',
      forceQuotes: false,
      lineWidth: -1,
    });

    return `---\n${yamlContent}---`;
  },

  validateConfig: (config: string) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.includes("[params]")) {
      errors.push("Missing [params] section");
    }
    // Ananke-specific: warn if nested author exists (should be simple string)
    if (config.includes("[params.author]")) {
      errors.push(
        "Ananke requires simple author string in [params], not nested [params.author]",
      );
    }
    if (!config.includes("unsafe = true")) {
      warnings.push(
        "Goldmark unsafe rendering not enabled - images may not display correctly",
      );
    }
    if (
      config.includes('theme = "PaperMod"') ||
      config.includes('theme = "papermod"')
    ) {
      errors.push("Config has wrong theme - expected ananke");
    }

    return { valid: errors.length === 0, errors, warnings };
  },

  getDefaultConfig: (
    blogName = "My Blog",
    baseURL = "https://example.org/",
  ): string => `baseURL = "${baseURL}"
languageCode = "en-us"
title = "${escapeYaml(blogName)}"
theme = "ananke"

[params]
  author = "StaticPress User"
  show_reading_time = false
  mainSections = ["posts"]

[markup]
  [markup.goldmark]
    [markup.goldmark.renderer]
      unsafe = true
`,
};
