module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#16a34a',
          light: '#34d399',
          dark: '#15803d'
        },
        accent: {
          DEFAULT: '#4f46e5'
        }
      },
      borderRadius: {
        'xl-2': '1rem'
      }
    },
  },
  plugins: [],
};
