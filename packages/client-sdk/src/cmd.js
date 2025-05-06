import { cmd as _cmd } from '@miso.ai/commons';

export default function cmd(callback) {
  // kick off misodev execution
  const cmdTransforms = [];
  function addCmdTransform(transform) {
    cmdTransforms.push(transform);
  }
  _cmd('misodev', {
    transform: fn => () => fn({ addCmdTransform }),
  });
  const cmdTransform = fn => {
    for (const transform of cmdTransforms) {
      fn = transform(fn);
    }
    return fn;
  };

  // do misocmd with setTimeout, so they will be executed after plugins are installed.
  setTimeout(() => {
    _cmd('misocmd', {
      transform: cmdTransform,
    });
    callback && callback();
  });
}
