const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const { scriptOutputName, version } = require("./package.json");

if (!scriptOutputName) {
  throw new Error('"scriptOutputName" must be set in package.json');
}

/**
 * Firebot loads exactly one CommonJS file whose default export is the script
 * object. The output must therefore be a single self-contained bundle with the
 * public function names (`run`, `getScriptManifest`, `getDefaultParameters`)
 * preserved so Firebot can call them.
 */
module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    target: "node",
    entry: "./src/main.ts",
    output: {
      libraryTarget: "commonjs2",
      libraryExport: "default",
      path: path.resolve(__dirname, "dist"),
      filename: `${scriptOutputName}.js`,
      clean: true,
    },
    devtool: isProduction ? false : "source-map",
    module: {
      rules: [
        {
          test: /\.ts$/,
          loader: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".js"],
    },
    plugins: [
      new webpack.DefinePlugin({
        __SCRIPT_VERSION__: JSON.stringify(version),
      }),
    ],
    optimization: {
      minimize: isProduction,
      minimizer: [
        new TerserPlugin({
          extractComments: false,
          terserOptions: {
            // Do not mangle: Firebot calls the public functions by name.
            mangle: false,
            keep_fnames: /main/,
            format: {
              comments: false,
            },
          },
        }),
      ],
    },
  };
};
