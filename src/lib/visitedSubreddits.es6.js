import uniq from 'lodash/array/uniq';
import cookies from 'cookies-js';

import constants from '../constants';

// Return an array of ids of the subreddits the user has visited recently.
// Return [] if we are unable to access such a list.
export function getVisitedSubreddits(username) {
  const key = [username, constants.RECENT_SUBREDDITS_KEY].join('_');

  const cookieString = cookies.enabled ? cookies.get(key) : '';
  const cookieArr = cookieString ? cookieString.split(',') : [];

  return cookieArr;
}

// Stores the array of recently-visited subreddits
// Stores only unique subreddits and limited to RECENT_SUBREDDIT_COUNT
// The subreddits should be provided in descending chronological order (most-recent
// first), so that the implementation provides us with the most recently
// visited subreddits.
// If we cannot store the list (no cookies), then this is a silent no-op.
export function setVisitedSubreddits(username, srs) {
  const visited = uniq(srs);
  const key = [username, constants.RECENT_SUBREDDITS_KEY].join('_');
  const value = visited
                .slice(0, constants.RECENT_SUBREDDIT_COUNT)
                .join(',');

  if (cookies.enabled) {
    cookies.set(key, value);
  }
}

