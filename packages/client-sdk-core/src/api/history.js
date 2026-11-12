/** @module core */

import { API } from '@miso.ai/commons';
import ApiBase from './base.js';

const { GROUP } = API;

/**
 * User history APIs, available as `client.api.ask.userHistory`, for the
 * current user's past conversation threads.
 */
class UserHistory extends ApiBase {

  constructor(api) {
    super(api, GROUP.ASK_USER_HISTORY);
  }

  /**
   * List the user's threads.
   *
   * @param {Object} payload
   * @param {boolean} [payload.favorite] - Omit to list all threads, `true` for starred threads only, `false` for unstarred threads only. Since 1.14.2.
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
   * Star or unstar a thread. This sets the star to the given state instead of
   * toggling it, so retries and repeated calls are safe.
   *
   * @param {string} threadId
   * @param {Object} [payload]
   * @param {boolean} [payload.favorite=true] - `true` to star the thread, `false` to unstar it.
   * @param {Object} [options] - Request options.
   * @returns {Promise<Object>} The thread's star state: `{ thread_id, favorite, favorited_at }`.
   * @since 1.14.2
   */
  async favoriteThread(threadId, payload, options) {
    return this._run(`threads/${threadId}/favorite`, payload, options);
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

export default UserHistory;
