import writeSessionToResponse from './writeSessionToResponse';
import { PrivateAPI } from '@r/private';

import { logServerError } from 'lib/errorLog';

export default (router, apiOptions) => {
  router.post('/registerproxy', async (ctx/*, next*/) => {
    const { username, password, email, newsletter, gRecaptchaResponse } = ctx.request.body;

    try {
      const newsletterSubscribe = !!newsletter.length;
      const data = await PrivateAPI.register(apiOptions, username, password, email,
                                             newsletterSubscribe, gRecaptchaResponse);
      // writeSessionToResponse will set the cookies
      writeSessionToResponse(ctx, data);
    } catch (error) {
      ctx.status = 401;
      if (error && (typeof error === 'string')) {
        ctx.body = { error };
      } else { // we're not sure what this error is, log it for now
        logServerError(error, ctx);
      }
    }
  });
};
