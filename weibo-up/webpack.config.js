const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const UserscriptMetaDataPlugin = require('userscript-metadata-webpack-plugin');

// 油猴脚本元数据
const metadata = {
  name: '微博增强',
  namespace: 'https://github.com/youhou',
  version: '1.0.0',
  description: '微博增强脚本 - 自动适应深色/浅色模式，评论悬浮窗，页面宽屏显示，支持扩展通知',
  author: '',
  match: [
    '*://weibo.com/*',
    '*://*.weibo.com/*'
  ],
  grant: [
    'GM_setValue',
    'GM_getValue',
    'GM_registerMenuCommand',
    'unsafeWindow'
  ],
  run_at: 'document-start'
};

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'weibo-up.user.js'
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: /(@\w+|==\/UserScript==|==UserScript==)/i,
          },
          compress: {
            drop_console: false,
          },
        },
        extractComments: false,
      }),
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new UserscriptMetaDataPlugin({
      metadata,
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/,
        use: 'raw-loader',
      },
    ],
  },
};
