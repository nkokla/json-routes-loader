# json-routes-loader

Agnostic library for simplify the asynchronous loading of routes JSON data.

## TL;DR

Gives all tools you need for async load routes data of your app and simplify your workflow:

- Write (or generate) your routes data in JSON file.
- Write (or generate) a register for indexes all your routes.
- Load asynchronously the register in your app with json-routes-loader.
- Load asynchronously your route data during your navigations with json-routes-loader.
- Be happy.

## Getting Started

### Prerequisites

It's probably better if you know JSON and JavaScript. 😉

### How to use

Install the json-routes-loader lib...

```JavaScript
npm i json-routes-loader
```

...import the lib...

```JavaScript
import JsonRoutesLoader from 'json-routes-loader'

// Set your options (Facultative)
const myOptions = {
    // [... See below]
}
```

... Use the lib.

```JavaScript
// Create a new provider:
const jsonRoutesProvider = new JsonRoutesLoader(myOptions)

// [... Use the methods below for get yours routes data]
// jsonRoutesProvider.initRegister()
// jsonRoutesProvider.loadRoute()
// jsonRoutesProvider.loadRoutes()
```

_This `Provider` give you all properties and methods to load and get yours routes data._

### Options

You can set an `Object` for configure your jsonRoutesProvider.  
Below, you can see the default options:

```JavaScript
const myOptions = {
    urlRegister: null,
    fetchOptions: null,
    prefixRoute: "",
    providerFormater: (raw = {}) => raw,
    registerFormater: formatedRawAsRegister => formatedRawAsRegister,
    routeFormater: (route, routeData) => routeData,
    payloadFormater: (formatedRaw, formatedRouteData, payload) => payload
}
```

- **`urlRegister`** (String||`null` - default: `null`):  
  The location (relative or absolute) of data where extract the register.

- **`fetchOptions`** (Object - default: `null`):  
  If given, this object will be send as option to the fetch function. For details, you can See the documentation on MDN (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

- **`prefixRoutePath`** (String - default: `""`):  
  Prefixes all relative path of route set in the register.

- **`providerFormater`** (Function - default: `(raw = {}) => raw`):  
  This function is use for pre-formatting the `raw` properties. Gets as argument the return of call to the `urlRegister`.  
   If `urlRegister` is `null`, `raw` is an empty object(`{}`).

- **`registerFormater`** (Function - default: `formatedRawAsRegister => formatedRawAsRegister`):  
  This function is use for pre-formatting the `register` properties. Gets as argument the return of `providerFormater()`.This function is use for pre-formatting the `register` properties. Gets as argument the return of `providerFormater()` set in options.

- **`routeFormater`** (Function - default: `(route, routeData) => routeData`):  
  This function is use for formating each `routeData` of the `register`. Get as arguments the `route` and his raw `routeData`.

- **`payloadFormater`** (Function - default: `(registerRaw, formatedRouteData, payload) => payload`):  
  This function is use for pre-formating each `routeData.payload` of the `register`. Get as arguments formated `raw`, formated `routeData` (so after usage of `routeFormater`) and raw `payload`.

### Properties

#### - raw

```JavaScript
const myRawData = jsonRoutesProvider.raw
```

JSON Object: Represents the formatted raw data (see the `providerFormater` option) loaded from the `urlRegister` option.
It be `null` before call to `jsonRoutesProvider.initRegister()`

_This JSON object can contains all you want. It will be used for extract or produce the `register` after formatting by the `registerFormater` function given in options._

#### - register

```JavaScript
const myRegister = jsonRoutesProvider.register
```

JSON Object: Represents the formated (see `registerFormater` option) raw data extract from the `jsonRoutesProvider.raw`.  
It is `null` before call `jsonRoutesProvider.initRegister()`

The `register` properties is a simple JSON Object key/value who respect the format below:

```JSON
  "url": [Object `routeData`],
```

Where `routeData` is a JSON Object with at least one of these keys:

- `payload` (JSON Object): The data of the route.
- `path` (String): The URL where loading asynchronously the content of payload (during the call, this path, if is relative, is automatically prefixed by the content of the `prefixRoutePath` option).

_If the `routeData` do not have `payload`, the provider can load them with the `loadRoute(path)` method._

Sample of register object:

```JSON
{
  "route-A": {
    "path": "/my/relative-path/to-route-data-a.json",
  },
  "route-B": {
    "path": "//myapi.ext/my/absolute-path/to-route-data-b.json",
  },
  "route-C": {
    "payload": {[Any JSON data]}
  },
  "route-D": {
    "path": "/my/path-to/route-data-d.json",
    "payload": {[Any JSON data after loading]}
  },
  "route-E": {
    "path": "/my/path/to/route/data/e.json",
    "payload": {[Any JSON data after loading]},
    "facultative-content": "Hello world"
   },
  [...]
}
```

### Methods

#### - initRegister

```JavaScript
jsonRoutesProvider.initRegister([options])
```

- **`option`** (Object - not require - default: `null`): If given, overload the given or default options.

1. Initializes options of the provider (if [options] is given).
2. Loads the raw data.
3. Formats raw data (with the `providerFormater` option) and produce the `register`(with the `registerFormater` option)
4. Sets the `raw` and `register` properties.

**Returns** a Promise to get the data of the register, update the provider and return the register.

#### - loadRoute

```JavaScript
jsonRoutesProvider.loadRoute(route[, fetchOptions])
```

- **`route`** (String - require): The route of wanted data.
- **`fetchOptions`** (Object - not require - default: `null`): If given, this object will be send as option to the fetch function. It overload the given or default option `fetchOptions`. For details, you can See the documentation on MDN (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

1. Formats the route value of the register (with the `routeFormater` option)
2. Loads the data for a given route.
3. Formats the JSON data of the route (with the `payloadFormater` option)
4. Sets the payload value in the register for the given route

**Returns** a Promise to update and return the provider (`jsonRoutesProvider` in our sample)

#### - loadRoutes

```JavaScript
jsonRoutesProvider.loadRoutes([routes][, fetchOptions])
```

- **`routes`** (Array of string - not require - default: `[]`): The routes of wanted data. Set an empty array (the default value) for loading all routes present in the register.
- **`fetchOptions`** (Object - not require): If given, this object will be send as option to the fetch function. It overload the given or default option `fetchOptions`. For details, you can See the documentation on MDN (https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API).

Loads the JSON data for all given routes (with the same process of `loadRoute()`).

**Returns** a Promise to update and return the provider (`jsonRoutesProvider` in our sample)

## Versioning

This project use [SemVer](http://semver.org/) for versioning.

## Authors

- **Nicolas KOKLA** - _Initial work_
  - _Github_: [nkokla](https://github.com/nkokla)
  - _Twitter_: [@nkokla](https://twitter.com/nkokla)

See also the list of [contributors](https://github.com/nkokla/json-routes-loader/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
