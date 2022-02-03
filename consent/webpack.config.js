const path = require('path');
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: ['./index.js', './index.scss'],
  output: {
    filename: 'consent.js',
    path: path.resolve(__dirname, '.'),
  },
	plugins: [
		new NodePolyfillPlugin(),
    new MiniCssExtractPlugin({
      filename: 'consent.css',
    }),
	],
  performance: {
    hints: false,
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  },
  module: {
    rules: [
      {
        test: /\.s[ac]ss$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
      },
    ],
  },
};