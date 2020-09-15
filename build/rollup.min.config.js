import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import vue from 'rollup-plugin-vue';

export default [
  // UMD
  {
    input: 'src/index.js',
    output: {
      format: 'umd',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.umd.min.js',
      globals: {
        '@vue/composition-api': 'vueCompositionApi',
        vue: 'vue',
      },
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
    external: ['@vue/composition-api', 'vue'],
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
    external: ['@vue/composition-api', 'vue'],
  },
];
