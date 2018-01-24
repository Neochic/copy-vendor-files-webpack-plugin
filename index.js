'use strict';
const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const glob = require("glob");

let options = {};
const knownFiles = {};
let fileStats = {};
let neededFiles = {};

let CopyVendorFilesWebpackPlugin = function(pluginOptions) {
    options = Object.assign({
        vendorPath: "./dist/vendor-assets",
        vendorStylePath: "vendor-assets"
    }, pluginOptions);

    //remove trailing slashes
    options.vendorPath = options.vendorPath.replace(/\/$/, "");
    options.vendorStylePath = options.vendorStylePath.replace(/\/$/, "");
};

let processEntry = function(resourcePath) {
    delete neededFiles[resourcePath];
};

let addFile = function(resourcePath, filePath) {
    const hash = getHash(filePath);
    const extLength = path.extname(filePath).length;
    if(!neededFiles[resourcePath]) {
        neededFiles[resourcePath] = {};
    }
    neededFiles[resourcePath][filePath] = filePath.slice(0, extLength*-1)+'-'+hash+filePath.slice(extLength*-1);

    return neededFiles[resourcePath][filePath];
};

let getHash = function(file) {
    if(!fileStats[file]) {
        fileStats[file] = fs.statSync("./node_modules/" + file);
    }

    if(!knownFiles[file] || knownFiles[file].mtime !== fileStats[file].mtimeMs) {
        const hash = crypto.createHash('md5');
        hash.update(fs.readFileSync("./node_modules/" + file), 'utf8');
        knownFiles[file] = {
            mtime: fileStats[file].mtimeMs,
            hash: hash.digest('hex')
        }
    }

    return knownFiles[file].hash;
};

CopyVendorFilesWebpackPlugin.loader = function(loaderOptions) {
    return {
        loader: path.resolve(__dirname, 'loader'),
        options: Object.assign({
        }, loaderOptions, {
            addFile: addFile,
            processEntry: processEntry,
            vendorStylePath: options.vendorStylePath
        })
    };
};

const removeIfEmpty = function(dirs, callback) {
    if(dirs.length < 1) {
        callback();
        return;
    }

    const dir = dirs.pop();
    fs.readdir(dir, (err, files) => {
        if(files.length < 1) {
            fs.rmdir(dir, () => {
                removeIfEmpty(dirs, callback);
            });
            return;
        }
        removeIfEmpty(dirs, callback);
    });
};

CopyVendorFilesWebpackPlugin.prototype.apply = function(compiler) {
    compiler.plugin('emit', function(compilation, callback) {
        let neededFilesCombined = {};
        fileStats = {};
        for(const resourcePath in neededFiles) {
            neededFilesCombined = Object.assign(neededFilesCombined, neededFiles[resourcePath]);
        }

        const neededFilesValues = Object.values(neededFilesCombined);
        let filesToRemove = 0;
        let filesToCopy = 0;
        const checkReady = function() {
            if(filesToCopy === 0 && filesToRemove === 0) {
                glob(options.vendorPath+'/**/*/', (err, dirs) => {
                    removeIfEmpty(dirs, callback);
                });
            }
        };

        glob(options.vendorPath+'/**/*', {
            nodir:true
        }, function(err, files) {
            for(const file of files) {
                if (neededFilesValues.indexOf(file.substr(options.vendorPath.length+1)) < 0) {
                    filesToRemove++;
                    fs.remove(file, () => {
                        filesToRemove--;
                        checkReady();
                    });
                }
            }

            for(const file in neededFilesCombined) {
                const targetPath = options.vendorPath + '/' + neededFilesCombined[file];
                if (files.indexOf(targetPath) < 0) {
                    filesToCopy++;
                    fs.copy('./node_modules/'+file, targetPath, () => {
                        filesToCopy--;
                        checkReady();
                    });
                }
            }

            checkReady();
        });
    });
};

module.exports = CopyVendorFilesWebpackPlugin;
