import { API } from '@miso.ai/commons';
import ApiBase from './base.js';

const { GROUP } = API;

export default class UserHistory extends ApiBase {

  constructor(api) {
    super(api, GROUP.ASK_USER_HISTORY);
  }

  async getThreads(options) {
    return this._run('threads', undefined, { ...options, method: 'GET' });
  }

  async getThread(threadId, options) {
    return this._run(`threads/${threadId}`, undefined, { ...options, method: 'GET' });
  }

  async updateThread(threadId, payload, options) {
    return this._run(`threads/${threadId}`, payload, { ...options, method: 'PUT' });
  }

  async deleteThreads(payload, options) {
    return this._run('threads/_delete', payload, options);
  }

  async deleteAllThreads(options) {
    return this._run('threads/_delete_all', undefined, options);
  }

  async deleteThread(threadId, options) {
    return this._run(`threads/${threadId}`, undefined, { ...options, method: 'DELETE' });
  }

  async markThreadAsRead(threadId, options) {
    return this._run(`threads/${threadId}/read`, undefined, options);
  }

  async getNotifications(options) {
    return this._run('notifications', undefined, { ...options, method: 'GET' });
  }

  async dismissNotifications(options) {
    return this._run('notifications/dismiss', undefined, options);
  }

}
