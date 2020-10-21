import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';

import { terser } from 'rollup-plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import vue from 'rollup-plugin-vue';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';

export default [
  // UMD
  {
    input: 'src/index.js',
    output: {
      format: 'umd',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.umd.min.js',
      sourcemap: true,
    },
    plugins: [
      alias({
        entries: {
          vue: 'vue/dist/vue.runtime.esm-browser.prod.js',
        },
      }),
      resolve({ extensions, browser: true }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      commonjs(),
      terser(),
      vue(),
      typescript({
        include: [/\.tsx?$/, /\.vue\?.*?lang=ts/],
        useTsconfigDeclarationDir: true,
      }),
    ],
  },
  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      format: 'cjs',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.cjs.min.js',
    },
    plugins: [
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
      }),
      commonjs(),
      terser(),
      vue(),
    ],
  },
];
