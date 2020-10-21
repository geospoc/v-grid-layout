import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import vue from 'rollup-plugin-vue';
import typescript from 'rollup-plugin-typescript2';
import alias from '@rollup/plugin-alias';
import resolve from '@rollup/plugin-node-resolve';

const extensions = ['.js', '.ts', '.vue'];

export default [
  // ESM build to be used with webpack/rollup.
  {
    input: 'src/index.js',
    output: {
      format: 'esm',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.esm.js',
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
      file: 'dist/v-grid-layout.cjs.js',
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
      vue(),
      typescript(),
    ],
  },
  // UMD build.
  {
    input: 'src/index.js',
    output: {
      format: 'umd',
      name: 'v-grid-layout',
      file: 'dist/v-grid-layout.umd.js',
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
      vue(),
      typescript(),
    ],
  },
];
