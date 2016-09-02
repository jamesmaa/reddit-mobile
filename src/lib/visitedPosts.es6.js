import uniq from 'lodash/array/uniq';
import cookies from 'cookies-js';

import constants from '../constants';
// Return an array of ids of the posts the user has visited recently.
// Return [] if we are unable to access such a list.
export function getVisitedPosts(username) {
  const key = [username, constants.RECENT_CLICKS_KEY].join('_');
  const cookieString = cookies.enabled ? cookies.get(key) : '';
  const cookieArr = cookieString ? cookieString.split(',') : [];

  return cookieArr;
}

// Stores the array of recently-visited post IDs.
// Stores only unique IDs and limited to VISITED_POST_COUNT.
// The posts should be provided in descending chronological order (most-recent
// first), so that the implementation provides us with the most recently
// visited posts.
// If we cannot store the list (cookies not enabled), then this is a silent no-op.
export function setVisitedPosts(app, username, posts) {
  const visited = uniq(posts);
  const key = [username, constants.RECENT_CLICKS_KEY].join('_');
  const value = visited
                .slice(0, constants.RECENT_CLICKS_COUNT)
                .join(',');

  const options = {
    domain: app.getConfig('rootReddit'),
    secure: app.getConfig('https'),
    secureProxy: app.getConfig('httpsProxy'),
    httpOnly: false,
    maxAge: 1000 * 60 * 60 * 24 * 365 * 2,
  };
  if (cookies.enabled) {
    cookies.set(key, value, options);
  }
}

