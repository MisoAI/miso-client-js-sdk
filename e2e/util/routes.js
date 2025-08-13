export function createRouteHandler(fn) {
  return async route => {
    const request = route.request();
    const payload = request.postDataJSON();

    try {
      const data = await fn(payload);

      // TODO
      await route.fulfill({
        json: {
          data,
          message: 'success',
        },
      });
    } catch (error) {
      /*
      await route.fulfill({
        json: {
          error: error.message,
          message: 'error',
        },
      });
      */
    }
  };
}
