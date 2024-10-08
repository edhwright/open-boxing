/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
	theme: {
    extend: {
      colors: {
        ibuText: '#ffffff',
        ibuBg: '#5c6bc0',
        nysacText: '#004144',
        nysacBg: '#80d6ff',
        wbaText: '#ffffff',
        // wbaBg: '#333333',
        wbaBg: '#4e4e4e',
        wbcText: '#252525',
        wbcBg: '#42be65',
        ibfText: '#ffffff',
        ibfBg: '#da1e28',
        wboText: '#ffffff',
        wboBg: '#6d4c41',
        ringText: '#000000',
        ringBg: '#c0b38d',

      }
    },
	},
  plugins: [
    require('@tailwindcss/typography')
  ],
}
