import { urlFromPage } from '@r/platform/pageUtils';

// Returns the url of the last page the user was on that's not in the
// excludedUrls. For example, when a user closes a modal while jumping between
// /login and /register should go to neither but back to the original page 
// they were on.
export const lastGoBackDest = (platform, excludedUrls) => {
  let i = platform.currentPageIndex - 1;
  let prevPage = platform.history[i];
  // Find the first url in history that isn't in the excluded urls
  while (i > 0 && excludedUrls.filter(url => url === prevPage.url).length > 0) {
    i--;
    prevPage = platform.history[i];
  }
  // Found a valid page if the last page not equal login or regist
  // else revert to frontpage
  if (i > 0 && !(prevPage.url === '/login' || prevPage.url === '/register')) {
    return urlFromPage(prevPage);
  }
  return '/';
};
