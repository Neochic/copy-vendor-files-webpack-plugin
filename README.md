# Copy Vendor Files Webpack Plugin

This plugin for Webpack parses generated css for urls containing ```node_modules``` path fragments and copies the referenced files to a public vendor directory, applying a cache bust to the filenames, as well as to the referencing css.   

## Usage Example
Assuming the following directory structure:
```
|-- node_modules
    |-- some
        |-- resource.png
|-- js
    |-- main.js
|-- css
    |-- styles.css
|-- webpack.config.js
|-- package.json
```
..and the following ```style.css```
```css
.whatever {
    background-image: url("../node_modules/some/resource.png");
}
```
..using a ```webpack.config.js``` similar to this
```javascript
var ExtractTextPlugin = require("extract-text-webpack-plugin");
var CopyVendorFilesWebpackPlugin = require('copy-vendor-files-webpack-plugin');

module.exports = {
    entry: {
        "main": "./js/main.js",
        "styles": "./css/styles.css"
    },
    output: {
        filename: "./dist/[name].js"
    },
    plugins: [
        new CopyVendorFilesWebpackPlugin({
            vendorPath: "./dist/vendor-assets",
            vendorStylePath: "vendor-assets"
        }),
        new ExtractTextPlugin('./dist/[name].css')
    ],
    module: {
        loaders: [
            {
                test: /\.css/,
                loader: ExtractTextPlugin.extract({
                    use: [
                        CopyVendorFilesWebpackPlugin.loader(),
                        {
                            loader: "css-loader",
                            options: { url: false }
                        }
                    ]
                })
            }
        ]
    }
};

```
Your resulting directory Structure would probably look something like so *:

```
|-- node_modules
    |-- some
        |-- resource.png
|-- js
    |-- main.js
|-- css
    |-- styles.css
|-- dist                                                       //
    |-- vendor-assets                                          //    
        |-- some                                               //   Generated
            |-- resource-b2ac7685d519f95bd5cc86c4cb6a6fe6.png  // 
    |-- main.js                                                //
    |-- styles.css                                             //
|-- webpack.config.js
|-- package.json
```
containing the following ```styles.css```*:
```css
.whatever {
    background-image: url("vendor-assets/some/resource-b2ac7685d519f95bd5cc86c4cb6a6fe6.png");
}
```
\* disregarding the md5 hash/cachebust
