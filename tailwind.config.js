/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: { extend: {
    colors: {
      ink: { 950: '#0F0A1F', 900: '#160F2E', 850: '#1D1439', 800: '#241A47', 700: '#312259', 600: '#402C70', 500: '#553B8C' },
      gold: { 50: '#FBF6E9', 100: '#F5E9C4', 200: '#EBD79A', 300: '#DFC26D', 400: '#D4AF37', 500: '#C6A030', 600: '#A6832A', 700: '#8A6C23' },
      bone: { 50: '#FAF9F6', 100: '#F0EEE8', 200: '#D8D5CC', 400: '#9C978C' },
      success: '#3BA776', warn: '#D48A34', danger: '#C4514A',
    },
    fontFamily: { display: ['"Fraunces"', 'serif'], body: ['"Inter"', 'system-ui', 'sans-serif'], mono: ['"JetBrains Mono"', 'monospace'] },
    backgroundImage: {
      'gold-line': 'linear-gradient(90deg, transparent, #D4AF37, transparent)',
      'purple-wash': 'radial-gradient(ellipse 120% 80% at 50% -10%, #402C70 0%, #1D1439 45%, #0F0A1F 100%)',
      'purple-glow': 'radial-gradient(circle at 80% 20%, rgba(85,59,140,0.35), transparent 55%), radial-gradient(circle at 15% 70%, rgba(212,175,55,0.08), transparent 45%)',
    },
    boxShadow: { gold: '0 0 0 1px rgba(212,175,55,0.25), 0 8px 30px -8px rgba(212,175,55,0.25)', glass: '0 8px 32px rgba(15,10,31,0.55)' },
    animation: { shimmer: 'shimmer 2.2s linear infinite' },
    keyframes: { shimmer: { '0%': { backgroundPosition: '-500px 0' }, '100%': { backgroundPosition: '500px 0' } } },
  } },
  plugins: [],
}
