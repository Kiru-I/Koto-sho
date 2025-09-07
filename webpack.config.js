const path = require('path');

module.exports = {
  mode: 'development',
  entry: './background.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  target: 'webworker', // for MV3 service worker
  devtool: false, // disable source maps that inject eval()
  resolve: {
    fallback: { fs: false, path: false, os: false }
  }
};