#! /usr/bin/env node

// require('./load-env')

// TODO : For next step : Use this options :
// const argsp = require('args')
// const ora = require('ora')

const glob = require('glob')
const chalk = require('chalk')
const chokidar = require('chokidar')
const fs = require('fs-extra')

class Logger {
  _defaultLog(logFunc, ...arg) {
    if (console[logFunc]) return console[logFunc](...arg)
    return console.log(...arg)
  }
  debug(..._mess) {
    if (param.debug) {
      const mess = _mess.map((entry, i) =>
        typeof entry === 'string'
          ? `${chalk.magenta.bold(i === 0 ? '>> ' : '> ')}${entry}`
          : entry,
      )
      this._defaultLog('log', ...mess)
    }
    return
  }
  log(..._mess) {
    const mess = _mess.map((entry, i) =>
      typeof entry === 'string'
        ? `${chalk.blue.bold('>  ')}${entry}${'\n'}`
        : entry,
    )
    this._defaultLog('log', ...mess)
    return
  }
  warn(..._mess) {
    const mess = _mess.map((entry, i) =>
      typeof entry === 'string'
        ? `${chalk.yellow.bold(i === 0 ? '⚠  ' : '> ')}${chalk.yellow(
            entry,
          )}${'\n'}`
        : entry,
    )
    this._defaultLog('warn', ...mess)
    return
  }
  error(..._mess) {
    const mess = _mess.map((entry, i) =>
      typeof entry === 'string'
        ? `${chalk.red.bold(i === 0 ? '❌  ' : '> ')}${chalk.red(entry)}${'\n'}`
        : entry,
    )
    this._defaultLog('error', chalk.bgRed('Error !\n'), ...mess)
    return
  }
  success(..._mess) {
    const mess = _mess.map((entry, i) =>
      typeof entry === 'string'
        ? `${chalk.green.bold(i === 0 ? '✔  ' : '> ')}${chalk.green(
            entry.trim(),
          )}${'\n'}`
        : entry,
    )
    this._defaultLog('success', ...mess)
    return
  }
}

const logger = new Logger()

// -------------------
// -------------------

const defaultParam = {
  devMode: true,
  debug: true,
  relativeRootDir: './public/',
  routeFileExtension: 'json',

  registerPath: 'routes/index.json',
  routesDir: 'routes/',
  extendedData: {}, // Use for add data inside Register raw file
}

const libRoot = require('app-root-path')
const appRoot = process.cwd()
const package =
  fs.readJsonSync(`${appRoot}/package.json`, { throws: false }) || {}
const userParam = package.buildRegisterConfig

const param = {
  ...defaultParam,
  ...userParam,
}

logger.debug(chalk.magenta(`Path ? :>`))
logger.debug(`${chalk.magenta(`libRoot >`)}`, libRoot)
logger.debug(`${chalk.magenta(`__dirname >`)}`, __dirname)
logger.debug(`${chalk.magenta(`appRoot >`)}`, appRoot)
logger.debug(`${chalk.magenta(`Param >\n`)}`, param)
logger.debug(`${chalk.magenta(`package >\n`)}`, package)

// -------------------
// -------------------

const {
  relativeRootDir,
  routeFileExtension,
  registerPath: _registerPath,
  routesDir: _routesDir,
} = param
const registerPath = `${relativeRootDir}${_registerPath}`
const routesDir = `${relativeRootDir}${_routesDir}`

const globString = routesDir + `*.${routeFileExtension}`
const watcher = chokidar.watch([globString], {
  ignored: [registerPath],
  cwd: './',
})

// -------------------
// -------------------

const buildRegister = (routesFiles, flatRegister = {}) => {
  logger.debug('Routes =', routesFiles)
  const newFlatRegister = {}
  const register_ = routesFiles.reduce((acc, routeFile) => {
    const dataRoute = fs.readJsonSync(routeFile, { throws: false })
    const routeDef = dataRoute && dataRoute.route
    const routeUrl = routeDef && routeDef.path
    const routePreload = routeDef && routeDef.preload
    if (!routeUrl) {
      // TODO: Details error
      logger.error(`The file on '${routeFile}' do not have route data.`)
      return acc
    }
    if (acc[routeUrl]) {
      logger.error(
        `The route '${routeUrl}' has already been defined in the register. Data from the '${routeFile}' file will not be used.`,
      )
      return acc
    }

    const routeFilePath = routeFile.replace(/^.\/public/, '')

    newFlatRegister[routeUrl] = {
      path: routeFilePath,
      payload: fs.readJsonSync(routeFile, { throws: false }),
    }

    return {
      ...acc,
      [routeUrl]: {
        path: routeFilePath,
        ...(routePreload && {
          payload: fs.readJsonSync(routeFile, { throws: false }),
        }),
      },
    }
  }, {})

  logger.debug('register_ >>', register_)

  // -------------------
  // -------------------

  // ---------------
  // Tool function :
  // ---------------
  // const getRelativePath = fullPath => fullPath.replace(RegExp(`^${srcDir}`), '')
  // const getFileNameFromDestructuredPath = destructuredPath => {
  //   const getDestructuredPath = relativePath =>
  //     getRelativePath(relativePath)
  //       .replace(/\.json$/, '')
  //       .split('/')
  //   destructuredPath.length > 1
  //     ? destructuredPath.slice(1).join('/')
  //     : destructuredPath[0]
  // }

  // -------------------
  // -------------------
  // -------------------
  // const pathDevConfig = './src/config/devConfig.json'
  const pathDevConfig = './src/.routeLoaderDevSpy'
  const registerKey = 'register'
  // const registerKey = null
  const oldRegisterContainer =
    fs.readJsonSync(registerPath, { throws: false }) || {}
  const oldRegister = registerKey
    ? oldRegisterContainer[registerKey]
    : oldRegisterContainer

  if (JSON.stringify(oldRegister) !== JSON.stringify(register_)) {
    logger.debug('--- Diff ---')
    const newRegisterContainer = {
      ...oldRegisterContainer,
      ...(registerKey ? { [registerKey]: register_ } : register_),
    }
    fs.writeJsonSync(registerPath, newRegisterContainer, { spaces: 2 })
    logger.success('Register updated')
  } else {
    logger.debug('--- NoDiff ---')
  }

  if (
    param.devMode &&
    JSON.stringify(flatRegister) !== JSON.stringify(newFlatRegister)
  ) {
    fs.writeJsonSync(pathDevConfig, { date: Date.now() }, { spaces: 2 })
    logger.debug('--- Flat Register Updated ---')
  }

  const tempRegister = fs.readJsonSync(registerPath, { throws: false })
  logger.debug('tempRegister', tempRegister)

  logger.debug('-- OK --')
  // process.exit(0)

  logger.debug('-- Register File is sync --')

  return newFlatRegister
}

// -------------------
// -------------------
let flatRegister
let initScript = false

const routesFiles = glob
  .sync(globString)
  .filter(routeFile => routeFile !== registerPath)

buildRegister(routesFiles)

watcher
  .on('add', path => initScript && logger.log(`File ${path} has been added`))
  .on('change', path => {
    logger.log(`File ${path} has been changed`)
    const routesFiles = glob
      .sync(globString)
      .filter(routeFile => routeFile !== registerPath)
    flatRegister = buildRegister(routesFiles, flatRegister)
  })
  .on('unlink', path => logger.log(`File ${path} has been removed`))
  .on('ready', () => {
    logger.success(
      'Initial scan complete.',
      'Routes folder is watchin and ready for changes',
    )
    logger.debug(globString, watcher.getWatched())
    initScript = true
  })
