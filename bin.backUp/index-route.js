#! /usr/bin/env node

require('./load-env')

// TODO : For next step : Use this options :
// const argsp = require('args')
// const ora = require('ora')

const glob = require('glob')
const chalk = require('chalk')
const jsonfile = require('jsonfile')

const srcRootPath = './public/data-routes/'
const srcDir = `${srcRootPath}routes/`
const srcExt = 'json'

const destFile = `${srcRootPath}/index.json`
const navFile = `${srcRootPath}/layout/index.json`
const navLayoutHeader = `${srcRootPath}/layout/layout-header.json`
const navLayoutFooter = `${srcRootPath}/layout/layout-footer.json`
const registerFile = jsonfile.readFileSync(destFile, { throws: false }) || {}

// ---------------
// Tool function :
// ---------------
const getRelativePath = fullPath => fullPath.replace(RegExp(`^${srcDir}`), '')
const getDestructuredPath = relativePath =>
  getRelativePath(relativePath)
    .replace(/\.json$/, '')
    .split('/')
const getRealmFromDestructuredPath = destructuredPath =>
  destructuredPath.length > 1 ? destructuredPath[0] : ''
const getFileNameFromDestructuredPath = destructuredPath =>
  destructuredPath.length > 1
    ? destructuredPath.slice(1).join('/')
    : destructuredPath[0]

let oldRegisterFile = {}

// -------------------
// Register function :
// -------------------
const register = glob.sync(srcDir + `/**/*.${srcExt}`).reduce((acc, file) => {
  const routeData = jsonfile.readFileSync(file)
  if (!(routeData && routeData.route && routeData.route.path)) {
    console.log(
      chalk.black.bgYellow(' Warn > '),
      chalk.yellow(`The file in [${file}] do not have route.path property`),
    )
    return acc
  }

  const filePath = getRelativePath(file)
  const destructuredPath = getDestructuredPath(filePath)
  const realm = getRealmFromDestructuredPath(destructuredPath)
  const fileName = getFileNameFromDestructuredPath(destructuredPath)

  const path = routeData.route.path.replace(/^\//, '').replace(/\/$/, '')
  const url = `/${[]
    .concat(realm ? [realm] : [], path ? path.split('/') : [])
    .join('/')}`

  const searchType = 'data-set'
  const reg = RegExp(
    `(?:{{)(?<={{)(?:${searchType}::)((?:(?!}}).)*)(?:}})`,
    'g',
  )
  if (reg.test(url)) {
    reg.lastIndex = 0

    console.log(`>>>>> ${url}`)
    reg.lastIndex = 0
  }

  const dataSet = reg.test(url) && routeData.dataSet

  return {
    ...acc,
    [url]: {
      realm,
      fileName,
      filePath,
      ...(dataSet && { dataSet }),
    },
  }
}, {})

registerFile['register'] = register

// -------------------
// Nav function :
// -------------------
const nav = jsonfile.readFileSync(navFile)
const { mainNav, navData } = nav
const memoizeRegister = Object.entries(registerFile['register'])
nav['navData'] = Object.entries(navData).reduce(
  (acc, [name, menu]) => {
    const formatedMenu = Object.entries(menu).reduce(
      (acc, [filePath, menuValue]) => {
        const [url] = memoizeRegister.find(
          ([url, value]) => value.filePath === filePath,
        )
        if (!url) {
          console.log(
            `index-route error > '${filePath}' do not exist in register`,
          )
        }
        const urlPath = url.replace(/^\//, '').split('/')
        const computedUrl =
          menuValue.realm && urlPath.length > 1
            ? `/${[menuValue.realm].concat(urlPath.slice(1)).join('/')}`
            : url

        return {
          ...acc,
          [computedUrl]: menuValue,
        }
      },
      {},
    )
    return {
      ...acc,
      ...{ [name]: formatedMenu },
    }
  },
  { mainNav },
)
registerFile['nav'] = nav

// -------------------
// Layout function :
// -------------------
const layoutHeader = jsonfile.readFileSync(navLayoutHeader)
const layoutFooter = jsonfile.readFileSync(navLayoutFooter)
registerFile['layout'] = {
  layoutHeader,
  layoutFooter,
}

// -------------------
// Writing file :
// -------------------
if (JSON.stringify(registerFile) !== JSON.stringify(oldRegisterFile)) {
  oldRegisterFile = { ...registerFile }
  jsonfile.writeFileSync(destFile, registerFile, { spaces: 2 })
}

console.log('-- Register File is updated --')
