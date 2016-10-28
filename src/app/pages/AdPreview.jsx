import React from 'react';
import { Post } from 'app/components/Post';
import { models } from '@r/api-client';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';

const T = React.PropTypes;

export class AdPreview extends React.Component {
  static propTypes = {
    'queryParams': T.object,
  };


  render() {
    const { queryParams } = this.props;
    const { author, title, disable_comments, thumbnail, mobile_ad_url } = queryParams;
    const is_self = (queryParams.is_self === 'true');
    const compact = (queryParams.compact === 'true');
    const stubbedPostAttrs = {
      'adserver_click_url': '',
      'adserver_imp_pixel': '',
      'approved_by': null,
      'archived': false,
      'author_flair_css_class': null,
      'author_flair_text': null,
      'banned_by': null,
      'clicked': false,
      'contest_mode': false,
      'created': 1472709653.0,
      'created_utc': 1472680853.0,
      'distinguished': null,
      'domain': 'reddit.com',
      'downs': 0,
      'edited': false,
      'gilded': 0,
      'hidden': false,
      'hide_score': false,
      'href_url': '',
      'id': '50jspc',
      'imp_pixel': '',
      'likes': null,
      'link_flair_css_class': null,
      'link_flair_text': null,
      'locked': false,
      'media': null,
      'media_embed': {},
      'mod_reports': [],
      'name': 't3_50jspc',
      'num_comments': 10,
      'num_reports': null,
      'over_18': false,
      'permalink': '',
      'promoted': true,
      'quarantine': false,
      'removal_reason': null,
      'report_reasons': null,
      'saved': false,
      'score': 14,
      'secure_media': null,
      'secure_media_embed': {},
      'selftext': '',
      'selftext_html': null,
      'stickied': false,
      'suggested_sort': null,
      'third_party_tracking': null,
      'third_party_tracking_2': null,
      'ups': 0,
      'url': 'http://reddit.com',
      'user_reports': [],
      'visited': false,
    };
    const postParams = { author, is_self, title, disable_comments, thumbnail, mobile_ad_url };
    const postJSON = Object.assign(stubbedPostAttrs, postParams);
    const post = models.PostModel.fromJSON(postJSON);
    const user = { loading: true, loggedOut: true, name: 'me' };
    const postProps = {
      post,
      user,
      compact,
      postId: '123',
      hideComments: true,
      hideSubredditLabel: false,
      hideWhen: false,
      subredditIsNSFW: false,
      showOver18Interstitial: false,
      single: false,
      userActivityPage: false,
      z: 1,
      onToggleSavePost: () => {},
      onToggleHidePost: () => {},
      onReportPost: () => {},
    };
    return (<Post { ...postProps } />);
  }
}

const selector = createSelector(
  state => state.platform.currentPage.queryParams,
  queryParams => ({ queryParams }),
);

export default connect(selector)(AdPreview);

