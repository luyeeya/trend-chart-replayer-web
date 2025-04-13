import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}', // Next.js 13+ 使用 app 目录
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'sans-serif'],     // 默认无衬线字体
        mono: ['Geist Mono', 'monospace'], // 默认等宽字体
      },
    },
  },
  plugins: [],
};

export default config;