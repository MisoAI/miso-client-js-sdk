import { API } from '@miso.ai/commons';
import ApiBase from './base.js';

const { GROUP } = API;

/**
 * User history APIs, available as `client.api.ask.userHistory`, for the
 * current user's past conversation threads.
 */
export default class UserHistory extends ApiBase {

  constructor(api) {
    super(api, GROUP.ASK_USER_HISTORY);
  }

  /**
   * List the user's threads.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async getThreads(payload, options) {
    return this._run('threads', payload, { ...options, method: 'GET' });
  }

  /**
   * Get a thread, with the IDs of its questions.
   *
   * @param {string} threadId
   * @param {Object} [payload]
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async getThread(threadId, payload, options) {
    return this._run(`threads/${threadId}`, payload, { ...options, method: 'GET' });
  }

  /**
   * Update a thread, such as its title.
   *
   * @param {string} threadId
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async updateThread(threadId, payload, options) {
    return this._run(`threads/${threadId}`, payload, { ...options, method: 'PUT' });
  }

  /**
   * Delete multiple threads.
   *
   * @param {Object} payload
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async deleteThreads(payload, options) {
    return this._run('threads/_delete', payload, options);
  }

  /**
   * Delete all of the user's threads.
   *
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async deleteAllThreads(options) {
    return this._run('threads/_delete_all', undefined, options);
  }

  /**
   * Delete a thread.
   *
   * @param {string} threadId
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async deleteThread(threadId, options) {
    return this._run(`threads/${threadId}`, undefined, { ...options, method: 'DELETE' });
  }

  /**
   * Mark a thread as read, dismissing its notifications.
   *
   * @param {string} threadId
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async markThreadAsRead(threadId, options) {
    return this._run(`threads/${threadId}/read`, undefined, options);
  }

  /**
   * Subscribe to updates of a thread.
   *
   * @param {string} threadId
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async subscribeThread(threadId, options) {
    return this._run(`threads/${threadId}/subscribe`, undefined, options);
  }

  /**
   * Unsubscribe from updates of a thread.
   *
   * @param {string} threadId
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async unsubscribeThread(threadId, options) {
    return this._run(`threads/${threadId}/unsubscribe`, undefined, options);
  }

  /**
   * Get notifications of updates to the user's threads.
   *
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async getNotifications(options) {
    return this._run('notifications', undefined, { ...options, method: 'GET' });
  }

  /**
   * Dismiss all notifications.
   *
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>}
   */
  async dismissNotifications(options) {
    return this._run('notifications/dismiss', undefined, options);
  }

}
