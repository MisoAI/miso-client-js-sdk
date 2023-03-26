export default function(client) {
  return ({ group, name, payload }) => {
    // TODO: send uuid
    return client.api[group]._run(name, payload);
  };
}
