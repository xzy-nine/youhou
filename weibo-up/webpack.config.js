const path = require('path');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const UserscriptMetaDataPlugin = require('userscript-metadata-webpack-plugin');

// 油猴脚本元数据
const metadata = {
  name: '微博增强',
  namespace: 'http://tampermonkey.net/',  version: '1.0.4',
  description: '微博增强功能：自动适应深色/浅色模式，弹出页查看更多评论，页面宽屏显示，自定义背景图片',
  author: 'xzy-nine',
  match: [
    'https://*.weibo.com/*'
  ],  grant: [
    'GM_setValue',
    'GM_getValue',
    'GM_deleteValue',
    'GM_registerMenuCommand',
    'GM_addStyle',
    'GM_xmlhttpRequest',
    'GM_getResourceURL',
    'GM_openInTab',
    'unsafeWindow'
  ],
  run_at: 'document-start',
  updateURL: 'https://gh-proxy.com/https://raw.githubusercontent.com/xzy-nine/youhou/main/weibo-up/dist/weibo-up.user.js',
  downloadURL: 'https://gh-proxy.com/https://raw.githubusercontent.com/xzy-nine/youhou/main/weibo-up/dist/weibo-up.user.js',
  supportURL: 'https://github.com/xzy-nine/youhou/issues',
  homepageURL: 'https://github.com/xzy-nine/youhou'
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
