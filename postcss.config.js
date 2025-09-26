/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // TailwindCSS for utility-first styling
    tailwindcss: {},
    // Autoprefixer for browser compatibility
    autoprefixer: {
      // Support last 2 versions of all browsers
      overrideBrowserslist: [
        'last 2 versions',
        'not dead',
        'not < 2%'
      ]
    }
    // Let Next.js handle CSS optimization
  },
}

module.exports = config
