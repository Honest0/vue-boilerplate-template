require('./check-versions')()

const config = require('../config')
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = JSON.parse(config.dev.env.NODE_ENV)
}

const opn = require('opn')
const path = require('path')
const express = require('express')
const webpack = require('webpack')
const proxyMiddleware = require('http-proxy-middleware')
const portfinder = require('portfinder')
const chalk = require('chalk')
const utils = require('./utils.js')

const webpackConfig = process.env.NODE_ENV === 'testing'
  ? require('./webpack.prod.conf')
  : require('./webpack.dev.conf')

// automatically open browser, if not set will be false
let autoOpenBrowser = !!config.dev.autoOpenBrowser
// Define HTTP proxies to your custom API backend
// https://github.com/chimurai/http-proxy-middleware
let proxyTable = config.dev.proxyTable

let app = express()
let compiler = webpack(webpackConfig)

let devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

let hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: () => {}
})
// force page reload when html-webpack-plugin template changes
compiler.plugin('compilation', function (compilation) {
  compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
    hotMiddleware.publish({ action: 'reload' })
    cb()
  })
})

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  let options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
let staticPath = path.posix.join(config.dev.assetsPublicPath, config.dev.assetsSubDirectory)
app.use(staticPath, express.static('./static'))


portfinder.basePort = +process.env.PORT || config.dev.port || 8080

module.exports = portfinder.getPortPromise().then(port => {
  const urls = utils.prepareUrls('http', '0.0.0.0', port)

  devMiddleware.waitUntilValid(function () {
    console.log(`> Listening at: ${chalk.cyan(urls.localUrlForTerminal)} \n`)
  })

  console.log()
  console.log([
    `  App running at:`,
    `  - Local:   ${chalk.cyan(urls.localUrlForTerminal)}`,
    `  - Network: ${chalk.cyan(urls.lanUrlForTerminal)}`
  ].join('\n'))
  console.log(urls)

  app.listen(port, function (err) {
    if (err) {
      console.log(err)
      return
    }

    // when env is testing, don't need open it
    if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
      opn(urls.localUrlForBrowser)
    }
  })
}).catch(err => {
  console.log(err)
})
