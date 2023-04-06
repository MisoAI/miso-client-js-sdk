let MisoClientPromise, clientPromise, client;

export async function getClient() {
  const MisoClient = await getMisoClient();
  clientPromise = clientPromise || MisoClient.any();
  client = client || await clientPromise;
  if (!client.ui) {
    await timeout(0);
  }
  return client;
}

export async function getMisoClient() {
  return window.MisoClient || MisoClientPromise || (MisoClientPromise = waitForMisoClient());
}

async function waitForMisoClient() {
  return new Promise((resolve) => {
    const misocmd = window.misocmd || (window.misocmd = []);
    misocmd.push(() => resolve(window.MisoClient));
  });
}

function timeout(duration) {
  return new Promise(resolve => setTimeout(resolve, duration));
}
