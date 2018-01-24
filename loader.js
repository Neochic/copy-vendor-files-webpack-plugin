module.exports = function(source) {
    const options = this.query;
    const resourcePath = this.resourcePath;
    options.processEntry(resourcePath);

    return source.replace(/url\((?:['"]?)((?:\.\.\/)*node_modules\/(.*?))(?:['"]?)\)/g, function(match, styleRelativePath, nodeModulesRelativePath) {
        nodeModulesRelativePath = nodeModulesRelativePath.split(/[?#]+/)[0];
        const filePathWithCacheBust = options.addFile(resourcePath, nodeModulesRelativePath);

        return match.replace(styleRelativePath, options.vendorStylePath+"/"+filePathWithCacheBust);
    });
};
