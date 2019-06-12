export default class JsonRoutesLoader {
  raw = null;
  register = null;

  constructor(options = {}) {
    this.options = {
      urlRegister: null, // TODO : require ? Set a default value ?
      fetchOptions: null,
      prefixRoutePath: "",
      providerFormater: (raw = {}) => raw,
      registerFormater: formatedRawAsRegister => formatedRawAsRegister,
      routeFormater: (route, routeData) => routeData,
      payloadFormater: (formatedRaw, formatedRouteData, payload) => payload
    };

    this.setOptions(options);
  }

  async _fetchData(urlData, _fetchOptions) {
    const { urlRegister, fetchOptions } = this.options;
    const fetchUrl = urlData || urlRegister;
    return (fetchUrl
      ? fetch(fetchUrl, _fetchOptions || fetchOptions)
      : Promise.resolve({})
    )
      .then(response => {
        if (!response.ok) {
          const errorMessage = `http response ${response.status} > ${
            response.statusText
          }`;
          throw new Error(errorMessage);
        }
        return response;
      })
      .then(data => (data && data.json()) || {})
      .catch(function(error) {
        console.error(
          `JsonRoutesLoader Error > Failed to load remote data in '${fetchUrl}' :: ${
            error.message
          }`
        );
      });
  }

  setOptions = options => {
    this.options = {
      ...this.options,
      ...options
    };
  };

  initRegister = options => {
    if (options) this.setOptions(options);
    return this.loadRegister();
  };

  loadRegister = async () => {
    if (!this.register) {
      const { providerFormater, registerFormater } = this.options;
      const registerRaw = await this._fetchData(); // TODO : Check error
      this.raw = await providerFormater(registerRaw);
      this.register = await registerFormater(this.raw);
    }
    return Promise.resolve(this.register);
  };

  loadRoute = async (route, _fetchOptions) => {
    // TODO : Check Register
    const register = this.register;
    if (!register[route]) {
      console.error(`JsonRoutesLoader Error > The route [${route}] is unknow.`);
      return null;
    }

    const { payload } = register[route];
    const { routeFormater, payloadFormater, prefixRoutePath } = this.options;

    if (!payload) {
      // TODO : Move the routeFormater call on the loadRegister ?
      register[route] = await routeFormater(route, register[route]);
      const { path } = register[route];
      if (path) {
        const routeData = await this._fetchData(
          `${prefixRoutePath}${path}`,
          _fetchOptions
        );
        register[route].payload = await payloadFormater(
          this.raw,
          register[route],
          routeData
        );
      } else {
        console.error(
          `JsonRoutesLoader Error > The formated data for the route [${route}] do not have 'path' key.
Add a 'path' key to this route or patch the 'routeFormater' option`
        );
      }
    }

    this.register = register;
    return this;
  };

  loadRoutes = async (_routes = [], _fetchOptions) => {
    // TODO : Check Register
    const routes =
      !Array.isArray(_routes) || _routes.length === 0
        ? Object.keys(this.register)
        : _routes;
    const routesPromises = routes.map(route =>
      this.loadRoute(route, _fetchOptions)
    );
    await Promise.all(routesPromises);
    return this;
  };
}
