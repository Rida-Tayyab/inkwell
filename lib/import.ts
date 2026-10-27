import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import mammoth from 'mammoth';
import { generateJSON } from '@tiptap/html';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';

const SUPPORTED_TYPES = {
  'text/plain': '.txt',
  'text/markdown': '.md',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB

/**
 * Validate file type and size
 */
export function validateFile(file: File): { valid: boolean; error?: string } {
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File exceeds 2 MB limit' };
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!['txt', 'md', 'docx'].includes(ext || '')) {
    return { valid: false, error: 'Unsupported file type. Use .txt, .md, or .docx' };
  }

  return { valid: true };
}

/**
 * Convert imported file to Tiptap JSON
 */
export async function convertFileToContent(
  file: File
): Promise<{ valid: boolean; content?: any; error?: string; title?: string }> {
  const validation = validateFile(file);
  if (!validation.valid) {
    return { valid: false, error: validation.error };
  }

  try {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const title = file.name.replace(/\.[^/.]+$/, '');
    let html = '';

    if (ext === 'txt') {
      html = `<p>${escapeHtml(await file.text())}</p>`;
    } else if (ext === 'md') {
      const markdown = await file.text();
      html = marked(markdown) as string;
    } else if (ext === 'docx') {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        html = result.value;
      } catch (e) {
        return { valid: false, error: 'Failed to parse .docx file' };
      }
    }

    // Sanitize HTML to prevent XSS
    const cleaned = sanitizeHtml(html, {
      allowedTags: [
        'p',
        'br',
        'strong',
        'em',
        'u',
        'h1',
        'h2',
        'h3',
        'ul',
        'ol',
        'li',
        'blockquote',
        'code',
        'pre',
      ],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
    });

    if (!cleaned.trim()) {
      return { valid: false, error: 'File appears to be empty' };
    }

    // Convert to Tiptap JSON
    const content = generateJSON(cleaned, [StarterKit, Underline]);

    return { valid: true, content, title };
  } catch (e) {
    return { valid: false, error: 'Failed to process file' };
  }
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
