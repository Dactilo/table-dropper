const prod = process.argv.indexOf('-p') !== -1;

config = {
    entry: "./src/dactilo-tabledropper.ts",
    output: {
        filename: "main.js"
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js']
    },
    module: {
        loaders: [
            {
                test: /\.ts$/,
                loader: 'ts-loader'
            },
            {
                test: /\.(scss|sass|css)$/,
                use: [{
                    loader: "style-loader" // creates style nodes from JS strings
                }, {
                    loader: "css-loader" // translates CSS into CommonJS
                }, {
                    loader: "sass-loader" // compiles Sass to CSS
                }]
            }
        ]
    }
};

if (!prod) {
    config.devtool = "source-map";
}

module.exports = config;
