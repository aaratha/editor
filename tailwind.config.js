/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
    colors: {
      'editor-color': '#00000041',
      'border-color': '#ffffff2a',
      'focus-color': '#ffffff1c',
      'text-color': '#ffffff85',
      'editor-text-color': '#ffffffb7',
      'highlight1-color': '#68e8ffce',
      'focused-text-color': '#ffffff',
      red: '#ff00007c',
      'menu-color': '#303030ff',
      'highlight2-color': '#40ff80b2',
    }
  },
  plugins: []
}