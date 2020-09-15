module.exports = {
  presets: ['@babel/preset-env', '@babel/preset-flow'],
  env: {
    test: {
      plugins: [
        [
          'module-resolver',
          {
            root: ['./'],
            alias: {
              '@': './',
              '~': './',
            },
          },
        ],
      ],
      ignore: ['ava.config.cjs'],
    },
  },
};
