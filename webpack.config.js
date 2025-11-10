const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
module.exports = {
  context: path.resolve(__dirname, './src'),
  mode: 'production',
  entry: {
    vendor: [
      'jquery/src/jquery',
      'fluidbox',
      'retinajs'
    ],
    main: [
      './scrollappear.js',
      './application.js'
    ]
  },
  output: {
    path: path.resolve(__dirname, './assets/javascripts'),
    filename: '[name].js'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false
      })
    ]
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            targets: 'defaults',
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  }
};
