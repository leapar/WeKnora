/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#07c05f',
          50: '#e6f7eb',
          100: '#ccefd6',
          200: '#99dfad',
          300: '#66cf85',
          400: '#33c05c',
          500: '#07c05f',
          600: '#059a4b',
          700: '#047438',
          800: '#034e25',
          900: '#022813',
          foreground: '#ffffff',
        },
        brand: {
          light: 'var(--td-brand-color-light)',
          DEFAULT: 'var(--td-brand-color)',
          focus: 'var(--td-brand-color-focus)',
        },
        background: 'var(--td-bg-color-page)',
        foreground: 'var(--td-text-color-primary)',
        card: {
          DEFAULT: 'var(--td-bg-color-container)',
          foreground: 'var(--td-text-color-primary)',
        },
        muted: {
          DEFAULT: 'var(--td-bg-color-secondary)',
          foreground: 'var(--td-text-color-secondary)',
        },
        border: 'var(--td-border-level-1-color)',
        input: 'var(--td-input-bg-color)',
        destructive: {
          DEFAULT: 'var(--td-error-color)',
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        tencent: ['TencentSans', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--td-radius-large)',
        md: 'var(--td-radius-medium)',
        sm: 'var(--td-radius-small)',
      },
    },
  },
  plugins: [],
}
