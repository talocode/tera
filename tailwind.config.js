import tailwindcssAnimate from 'tailwindcss-animate'

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        'tera-bg': 'var(--bg-tera-bg)',
        'tera-panel': 'var(--bg-tera-panel)',
        'tera-elevated': 'var(--bg-tera-panel-strong)',
        'tera-muted': 'var(--bg-tera-muted)',
        'tera-highlight': 'var(--bg-tera-highlight)',
        'tera-border': 'var(--border-tera)',
        'tera-neon': 'var(--text-tera-accent)',
        'tera-primary': 'var(--text-tera-primary)',
        'tera-secondary': 'var(--text-tera-secondary)',
        'tera-accent': 'var(--text-tera-accent)',
        'tera-input': 'var(--bg-tera-input)'
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ['Manrope', 'Segoe UI Variable Display', 'Inter', 'ui-sans-serif', 'system-ui']
      },
      boxShadow: {
        'soft-lg': 'var(--shadow-tera-soft)',
        'panel': 'var(--shadow-tera-panel)',
        'glow-md': '0 18px 44px rgba(219, 188, 142, 0.16)'
      },
      transitionDelay: {
        '1000': '1000ms'
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite'
      },
    }
  },
  plugins: [tailwindcssAnimate]
}
