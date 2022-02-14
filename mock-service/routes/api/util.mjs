import { v1 as uuidv1 } from 'uuid';

export function respondSuccess(core, ctx, data) {
  ctx.body = {
    message: 'success',
    data: Object.assign({
      took: 5,
      miso_id: uuidv1()
    }, data)
  };
}
