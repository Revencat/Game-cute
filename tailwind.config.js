/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#527D59',
        grass: '#91C987',
        mint: '#D8EED7',
        cream: '#FFF8EC',
        ivory: '#FFFEFA',
        sky: '#BDE6F5',
        turquoise: '#8BD8D0',
        rose: '#F5B8CA',
        peach: '#F6C5A2',
        butter: '#F5DF91',
        lavender: '#D1C5F2',
        wood: '#9A7054',
        ink: '#35483B',
        subtle: '#718071',
      },
      fontFamily: {
        display: ['Fredoka', 'Nunito', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '20px',
        panel: '16px',
        pill: '999px',
      },
      boxShadow: {
        soft: '0 6px 24px -8px rgba(82, 125, 89, 0.18)',
        lift: '0 12px 32px -10px rgba(53, 72, 59, 0.25)',
      },
    },
  },
  plugins: [],
}
