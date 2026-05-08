/**
 * Security utilities - XSS prevention
 */

const FORBIDDEN_TAGS = ['script', 'style', 'object', 'embed', 'form', 'input', 'button']
const FORBIDDEN_ATTR = ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur']

/**
 * Escape HTML special characters
 */
export function escapeHTML(text: string): string {
  if (!text || typeof text !== 'string') {
    return ''
  }

  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }

  return text.replace(/[&<>"'`=\/]/g, (s) => map[s])
}

/**
 * Sanitize HTML content
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== 'string') {
    return ''
  }

  try {
    const doc = new DOMParser().parseFromString(html, 'text/html')

    const walk = (node: Node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as Element

        // Remove forbidden tags
        if (FORBIDDEN_TAGS.includes(element.tagName.toLowerCase())) {
          element.remove()
          return
        }

        // Remove forbidden attributes
        FORBIDDEN_ATTR.forEach(attr => {
          if (element.hasAttribute(attr)) {
            element.removeAttribute(attr)
          }
        })

        // Remove event handlers
        const attrs = Array.from(element.attributes)
        attrs.forEach(attr => {
          if (attr.name.startsWith('on')) {
            element.removeAttribute(attr.name)
          }
        })

        // Process children
        Array.from(element.childNodes).forEach(walk)
      }
    }

    Array.from(doc.body.childNodes).forEach(walk)

    // Remove dangerous protocols from href/src
    const links = doc.querySelectorAll('a[href]')
    links.forEach(link => {
      const href = link.getAttribute('href') || ''
      if (href.startsWith('javascript:') || href.startsWith('data:text')) {
        link.removeAttribute('href')
      }
    })

    return doc.body.innerHTML
  } catch (error) {
    console.error('HTML sanitization failed:', error)
    return escapeHTML(html)
  }
}

/**
 * Safely process Markdown content
 */
export function safeMarkdownToHTML(markdown: string): string {
  if (!markdown || typeof markdown !== 'string') {
    return ''
  }

  // Remove dangerous HTML tags
  const cleanedMarkdown = markdown
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')

  return cleanedMarkdown
}

/**
 * Validate URL safety
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  const trimmed = url.trim()
  if (!trimmed) {
    return false
  }

  // Allow relative paths starting with /
  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
    return true
  }

  // Allow provider:// URLs
  if (/^(local|minio|cos|tos|s3|oss|ks3):\/\/\S+$/i.test(trimmed)) {
    return true
  }

  try {
    const urlObj = new URL(trimmed)
    return ['http:', 'https:'].includes(urlObj.protocol)
  } catch {
    return false
  }
}
