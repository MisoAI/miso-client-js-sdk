let MisoClientPromise;

export async function getMisoClient() {
  return window.MisoClient || MisoClientPromise || (MisoClientPromise = waitForMisoClient());
}

async function waitForMisoClient() {
  return new Promise((resolve) => {
    const misocmd = window.misocmd || (window.misocmd = []);
    misocmd.push(() => resolve(window.MisoClient));
  });
}
