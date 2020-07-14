const { resolve } = require('path')
const zlib = require('zlib')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TenserWebpackPlugin = require('terser-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const CompressionPlugin = require('compression-webpack-plugin')
const { GenerateSW } = require('workbox-webpack-plugin')
const ThreeShakingWebpackPlugin = require('webpack-common-shake').Plugin

module.exports = {
	mode: 'production',
	entry: {
		vendors: resolve(process.cwd(), 'vendors/vendors.js'),
	},
	output: {
		filename: 'static/js/[name].[contenthash:10].bundle.js',
		chunkFilename: 'static/js/[name].[contenthash:10].chunk.js',
		pathinfo: false,
	},
	module: {
		rules: [
			{
				test: /\.(css|scss|sass)$/,
				use: [
					MiniCssExtractPlugin.loader,
					{
						loader: 'css-loader',
						options: {
							importLoaders: 2,
							sourceMap: true,
						},
					},
					{
						loader: 'postcss-loader',
						options: {
							ident: 'postcss',
							config: {
								path: resolve(process.cwd(), 'postcss.config.js'),
							},
							sourceMap: true,
						},
					},
				],
			},
			{
				test: /\.(jp?g|png|svg|gif|raw|webp|tiff)$/,
				use: {
					loader: 'url-loader',
					options: {
						name: 'static/images/[name].[contenthash:10].[ext]',
						limit: 10240,
					},
				},
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				use: {
					loader: 'url-loader',
					options: {
						name: 'static/fonts/[name].[contenthash:10].[ext]',
						limit: 10240,
					},
				},
			},
		],
	},
	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify('production'),
		}),
		new CleanWebpackPlugin({
			cleanAfterEveryBuildPatterns: ['build'],
		}),
		new HtmlWebpackPlugin({
			template: resolve(process.cwd(), 'public/index.html'),
			minify: {
				collapseWhitespace: true,
				useShortDoctype: true,
				keepClosingSlash: true,
				sortClassName: true,
				removeComments: true,
				removeRedundantAttributes: true,
				removeEmptyAttributes: true,
				removeStyleLinkTypeAttributes: true,
				removeTagWhitespace: true,
				collapseInlineTagWhitespace: true,
				minifyJS: true,
				minifyCSS: true,
				minifyURLs: true,
			},
		}),
		new ThreeShakingWebpackPlugin(),
		new MiniCssExtractPlugin({
			filename: 'static/css/[name].[contenthash:10].bundle.css',
			chunkFilename: 'static/css/[name].[contenthash:10].chunk.css',
		}),
		new GenerateSW({
			swDest: resolve(process.cwd(), 'build/service-worker.js'),
			runtimeCaching: [
				{
					handler: 'StaleWhileRevalidate',
					urlPattern: /\.(?:js|css|html|json)$/,
					options: {
						cacheName: 'static-assets-cache',
						cacheableResponse: {
							statuses: [0, 200],
						},
						expiration: {
							maxEntries: 100,
							maxAgeSeconds: 24 * 60 * 60 * 30,
						},
					},
				},
				{
					handler: 'CacheFirst',
					urlPattern: /\.(?:jp?g|png|svg|gif|raw|webp|tiff|ico)$/,
					options: {
						cacheName: 'images-assets-cache',
						cacheableResponse: {
							statuses: [200],
						},
						expiration: {
							maxEntries: 100,
							maxAgeSeconds: 24 * 60 * 60 * 30,
						},
					},
				},
				{
					handler: 'CacheFirst',
					urlPattern: /\.(?:woff|woff2|eot|ttf|otf)$/,
					options: {
						cacheName: 'fonts-assets-cache',
						cacheableResponse: {
							statuses: [200],
						},
						expiration: {
							maxEntries: 100,
							maxAgeSeconds: 24 * 60 * 60 * 30,
						},
					},
				},
			],
			clientsClaim: true,
			skipWaiting: true,
			cleanupOutdatedCaches: true,
		}),
		new CompressionPlugin({
			filename: '[path].br[query]',
			test: /\.(js|css|html|json)$/,
			algorithm: 'brotliCompress',
			compressionOptions: {
				level: zlib.constants.Z_BEST_COMPRESSION,
				strategy: zlib.constants.Z_RLE,
			},
			exclude: /node_modules/,
		}),
		new CompressionPlugin({
			filename: '[path].br[query]',
			test: /\.(jp?g|png|svg|gif|raw|webp|tiff)$/,
			algorithm: 'brotliCompress',
			compressionOptions: {
				level: zlib.constants.Z_BEST_COMPRESSION,
				strategy: zlib.constants.Z_RLE,
			},
			exclude: /node_modules/,
		}),
		new CompressionPlugin({
			filename: '[path].br[query]',
			test: /\.(woff|woff2|eot|ttf|otf)$/,
			algorithm: 'brotliCompress',
			compressionOptions: {
				level: zlib.constants.Z_BEST_COMPRESSION,
				strategy: zlib.constants.Z_RLE,
			},
			exclude: /node_modules/,
		}),
	],
	optimization: {
		minimize: true,
		minimizer: [
			new TenserWebpackPlugin({
				test: /\.(js|jsx)$/,
				terserOptions: {
					parser: { ecma: 7, bare_returns: true, html5_comments: false },
					compress: { module: true, inline: 1 },
					mangle: { module: true, toplevel: true },
					output: { comments: false, preserve_annotations: true, braces: true, indent_level: 2 },
					keep_classnames: true,
					keep_fnames: true,
					safari10: true,
				},
				parallel: require('os').cpus().length,
				extractComments: false,
				sourceMap: true,
			}),
			new OptimizeCssAssetsPlugin({
				cssProcessor: require('cssnano'),
				cssProcessorPluginOptions: {
					preset: ['advanced', { discardComments: { removeAll: true }, convertValues: { precision: true } }],
				},
			}),
		],
		splitChunks: {
			cacheGroups: {
				vendors: {
					name: false,
					test: /\.js$/,
					chunks: 'all',
					enforce: true,
					reuseExistingChunk: false,
				},
			},
		},
	},
	devtool: 'source-map',
}