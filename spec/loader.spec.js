const loader = require("../loader");

describe("Loader", function () {
    it("should replace node_modules asset paths with asset target directory", function () {
        const source = `
            body { background-image: url(../../node_modules/foo/bar.jpg); }
            @font-face {
              font-family: 'Some font';
              font-style: normal;
              font-weight: 300;
              src: url('../../node_modules/font/some-font.eot');
            }
            .foo {
                background-image: url("../../node_modules/foo/other.png");                
            }
            `;
        const expectedResult = `
            body { background-image: url(my-vendor-path/foo/bar.jpg?123); }
            @font-face {
              font-family: 'Some font';
              font-style: normal;
              font-weight: 300;
              src: url('my-vendor-path/font/some-font.eot?123');
            }
            .foo {
                background-image: url("my-vendor-path/foo/other.png?123");                
            }
            `;

        const context = {
            query: {
                processEntry: function(){},
                addFile: function(resourcePath, filePath){
                    return filePath + "?123";
                },
                vendorStylePath: "my-vendor-path"
            }
        };

        expect(loader.call(context, source)).toBe(expectedResult);
    });
});
