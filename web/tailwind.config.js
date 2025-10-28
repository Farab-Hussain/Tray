/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'custom-green': '#187D22',
        'custom-yellow': '#FFCB4B',
        'custom-light-green': '#ADEBB3',
        'custom-light-yellow': '#FFF0CB',
        'custom-red': '#E64646',
        'custom-black': '#000000',
        'custom-gray': '#6C6C6C',
      },
    },
  },
  plugins: [],
}
