const path = require('path');
const webpack = require('webpack');
module.exports = {
  context: path.resolve(__dirname, './src'),
  entry: {
    vendor: [
      'jquery/src/jquery',
      'throttle-debounce-fn/src/throttle-debounce-fn',
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
  plugins: [
    new webpack.optimize.UglifyJsPlugin({minimize: true})
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  }
};
