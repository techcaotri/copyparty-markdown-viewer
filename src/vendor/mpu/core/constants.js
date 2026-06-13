/**
 * Application Constants
 * Centralized configuration values for the preview client
 */

// Debug mode - set to false for production to reduce logging overhead
export const DEBUG = false;

// Supported markdown file extensions
export const SUPPORTED_EXTENSIONS = [
  '.md',
  '.markdown',
  '.mdown',
  '.mkd',
  '.mdc',
  '.mmd',
  '.mermaid',
  '.mdx',
  '.Rmd',
  '.rmd',
];

// Zoom configuration for overlay and document
export const ZOOM = {
  MIN: 0.1,
  MAX: 15.0,
  STEP: 0.03,
  STEP_FAST: 0.09,
  DEFAULT: 1,
};

// Search configuration
export const SEARCH = {
  MIN_QUERY_LENGTH: 3,
  MAX_HISTORY: 50,
  CONTEXT_LENGTH: 30,
};

// WebSocket reconnection configuration
export const RECONNECT = {
  MAX_ATTEMPTS: 10,
  INITIAL_DELAY: 1000,
  BACKOFF_FACTOR: 1.5,
};

// Sidebar configuration
export const SIDEBAR = {
  MIN_WIDTH: 150,
  MAX_WIDTH: 500,
  DEFAULT_WIDTH: 250,
};

// localStorage keys
export const STORAGE_KEYS = {
  THEME: 'mpe-theme',
  SEARCH_HISTORY: 'mpe-search-history',
  SEARCH_BAR_LEFT: 'mpe-search-bar-left',
  SEARCH_BAR_TOP: 'mpe-search-bar-top',
  FILES_SIDEBAR_COLLAPSED: 'mpe-files-sidebar-collapsed',
  SIDEBAR_COLLAPSED: 'mpe-sidebar-collapsed',
  FILES_SIDEBAR_WIDTH: 'mpe-files-sidebar-width',
  SIDEBAR_WIDTH: 'mpe-sidebar-width',
  IMAGE_THEME_PREFIX: 'mpe-img-theme-',
  IMAGE_ZOOM_PREFIX: 'mpe-img-zoom-',
  VIEWER_SETTINGS: 'mpe-viewer-settings',
};

// Default Markdown Viewer typography settings
export const DEFAULT_VIEWER_SETTINGS = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mermaidFontFamily: 'trebuchet ms, verdana, arial, sans-serif',
  outlineFontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSizeAdjustment: 0,
};

// Font families available for Markdown Viewer settings
export const VIEWER_FONT_FAMILIES = [
  // System fonts
  { label: 'System Default', value: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' },

  // Sans-serif fonts
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Arial Black', value: '"Arial Black", Gadget, sans-serif' },
  { label: 'Arial Narrow', value: '"Arial Narrow", Arial, sans-serif' },
  { label: 'Calibri', value: 'Calibri, "Segoe UI", Arial, sans-serif' },
  { label: 'Candara', value: 'Candara, Calibri, sans-serif' },
  { label: 'Century Gothic', value: '"Century Gothic", CenturyGothic, sans-serif' },
  { label: 'Corbel', value: 'Corbel, "Lucida Grande", sans-serif' },
  { label: 'Franklin Gothic', value: '"Franklin Gothic Medium", "Franklin Gothic", sans-serif' },
  { label: 'Futura', value: 'Futura, "Trebuchet MS", sans-serif' },
  { label: 'Geneva', value: 'Geneva, Verdana, sans-serif' },
  { label: 'Gill Sans', value: '"Gill Sans", "Gill Sans MT", Calibri, sans-serif' },
  { label: 'Helvetica', value: 'Helvetica, Arial, sans-serif' },
  { label: 'Helvetica Neue', value: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { label: 'Impact', value: 'Impact, Haettenschweiler, sans-serif' },
  { label: 'Lucida Grande', value: '"Lucida Grande", "Lucida Sans Unicode", sans-serif' },
  { label: 'Lucida Sans', value: '"Lucida Sans", "Lucida Sans Regular", sans-serif' },
  { label: 'Optima', value: 'Optima, Segoe, sans-serif' },
  { label: 'Segoe UI', value: '"Segoe UI", Tahoma, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", Helvetica, sans-serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },

  // Serif fonts
  { label: 'Baskerville', value: 'Baskerville, "Baskerville Old Face", serif' },
  { label: 'Book Antiqua', value: '"Book Antiqua", Palatino, serif' },
  { label: 'Bookman', value: '"Bookman Old Style", Bookman, serif' },
  { label: 'Cambria', value: 'Cambria, Georgia, serif' },
  { label: 'Constantia', value: 'Constantia, Georgia, serif' },
  { label: 'Didot', value: 'Didot, "Didot LT STD", serif' },
  { label: 'Garamond', value: 'Garamond, Baskerville, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Goudy Old Style', value: '"Goudy Old Style", Garamond, serif' },
  { label: 'Hoefler Text', value: '"Hoefler Text", Georgia, serif' },
  { label: 'Lucida Bright', value: '"Lucida Bright", Georgia, serif' },
  { label: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { label: 'Perpetua', value: 'Perpetua, Baskerville, serif' },
  { label: 'Rockwell', value: 'Rockwell, "Courier Bold", serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },

  // Monospace fonts
  { label: 'Consolas', value: 'Consolas, monaco, monospace' },
  { label: 'Courier', value: 'Courier, monospace' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
  { label: 'Lucida Console', value: '"Lucida Console", Monaco, monospace' },
  { label: 'Monaco', value: 'Monaco, Consolas, monospace' },
  { label: 'Source Code Pro', value: '"Source Code Pro", Consolas, monospace' },

  // Display/Decorative fonts
  { label: 'Brush Script', value: '"Brush Script MT", cursive' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive, sans-serif' },
  { label: 'Copperplate', value: 'Copperplate, "Copperplate Gothic Light", fantasy' },
  { label: 'Papyrus', value: 'Papyrus, fantasy' },
];

// PlantUML encoding alphabet
export const PLANTUML_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';

// File type icons mapping
export const FILE_ICONS = {
  markdown: '📝',
  mermaid: '📊',
  mdx: '⚛️',
  default: '📄',
};

// Catppuccin theme colors
export const THEME_COLORS = {
  light: {
    text: '#4c4f69',
    background: '#eff1f5',
    surface: '#e6e9ef',
    overlay: '#ccd0da',
    muted: '#8c8fa1',
    accent: '#1e66f5',
  },
  dark: {
    text: '#cdd6f4',
    background: '#1e1e2e',
    surface: '#313244',
    overlay: '#45475a',
    muted: '#a6adc8',
    accent: '#89b4fa',
  },
};
