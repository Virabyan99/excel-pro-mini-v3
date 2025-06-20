const config = {
  plugins: [
    [
      '@tailwindcss/postcss',
      {
        content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
        theme: {
          extend: {
            colors: {
              'error-50': '#fef2f2',  // Light red background
              'error-600': '#b91c1c', // Dark red text
            },
          },
        },
      },
    ],
  ],
};

export default config;