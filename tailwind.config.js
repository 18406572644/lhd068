/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{svelte,js,ts}'
  ],
  theme: {
    extend: {
      colors: {
        medical: {
          white: '#FDFEFE',
          blue: {
            50: '#EFF8FF',
            100: '#DBEAFE',
            200: '#BFDBFE',
            300: '#93C5FD',
            400: '#60A5FA',
            500: '#3B82F6'
          },
          green: {
            50: '#ECFDF5',
            100: '#D1FAE5',
            200: '#A7F3D0',
            300: '#6EE7B7',
            400: '#34D399',
            500: '#10B981'
          },
          warning: '#F59E0B',
          danger: '#EF4444',
          text: {
            primary: '#1F2937',
            secondary: '#6B7280',
            tertiary: '#9CA3AF'
          }
        }
      },
      fontFamily: {
        sans: ['"PingFang SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 2px 8px rgba(59, 130, 246, 0.08)',
        cardHover: '0 4px 16px rgba(59, 130, 246, 0.12)'
      }
    }
  },
  plugins: []
}
