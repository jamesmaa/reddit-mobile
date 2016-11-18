import './styles.less';

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { models } from '@r/api-client';
const { PostModel } = models;

import * as postActions from 'app/actions/posts';
import * as reportingActions from 'app/actions/reporting';

import {
  isPostDomainExternal,
  postShouldRenderMediaFullbleed,
} from './postUtils';

import PostHeader from './PostHeader';
import PostContent from './PostContent';
import PostFooter from './PostFooter';

const T = React.PropTypes;

function _isCompact(props) {
  return props.compact && !props.single;
}

const shouldForceHTTPS = (config) => {
  return config.https || config.httpsProxy;
};

Post.propTypes = {
  post: T.instanceOf(PostModel),
  postId: T.string,
  user: T.object,
  compact: T.bool,
  hideComments: T.bool,
  hideSubredditLabel: T.bool,
  hideWhen: T.bool,
  subredditIsNSFW: T.bool,
  showOver18Interstitial: T.bool,
  single: T.bool,
  userActivityPage: T.bool,
  z: T.number,
  onClickPostDescriptor: T.func,
  onClickTitle: T.func,
  onClickComments: T.func,
  onToggleSavePost: T.func,
  onToggleHidePost: T.func,
  onReportPost: T.func.isRequired,
};

Post.defaultProps = {
  z: 1,
  hideWhen: false,
  hideSubredditLabel: false,
  single: false,
  subredditIsNSFW: false,
  showOver18Interstitial: false,
  winWidth: 360,
  onClickPostDescriptor: () => { console.log('stubbed click post descript'); },
  onClickTitle: () => { console.log('stubbed click post title'); },
  onClickComments: () => { console.log('stubbed click post comments'); },
  onToggleSavePost: () => {},
  onToggleHidePost: () => {},
};

export function Post(props) {
  const userAgent = global.navigator && global.navigator.userAgent
    ? global.navigator.userAgent
    : '';

  const compact = _isCompact(props);
  const externalDomain = isPostDomainExternal(props.post);
  const renderMediaFullbleed = postShouldRenderMediaFullbleed(props.post);
  const forceHTTPS = shouldForceHTTPS({ https: true });
  const isAndroid = userAgent && /android/i.test(userAgent);
  const showLinksInNewTab = externalDomain && isAndroid;
  const showNSFW = props.subredditIsNSFW || props.unblurred;

  const {
    post,
    editing,
    editPending,
    expanded,
    user,
    single,
    hideSubredditLabel,
    hideWhen,
    userActivityPage,
    onClickPostDescriptor,
    onClickTitle,
    onClickComments,
    onToggleEdit,
    onToggleSavePost,
    onToggleHidePost,
    onReportPost,
    onUpdateSelftext,
    toggleExpanded,
    toggleShowNSFW,
    winWidth,
    z,
  } = props;

  if (post.isBlankAd) {
    // Return an empty div if it's a blank ad
    return <div class='blankAd'/>;
  }

  let thumbnailOrNil;
  if (compact) {
    thumbnailOrNil = (
      <PostContent
        post={ post }
        single={ single }
        compact={ true }
        expandedCompact={ false }
        onTapExpand={ toggleExpanded }
        width={ winWidth }
        toggleShowNSFW={ toggleShowNSFW }
        showNSFW={ showNSFW }
        editing={ false }
        forceHTTPS={ forceHTTPS }
        isDomainExternal={ externalDomain }
        renderMediaFullbleed={ renderMediaFullbleed }
        showLinksInNewTab={ showLinksInNewTab }
      />
    );
  }

  const hasExpandedCompact = compact && expanded;
  const isPromotedUserPost = post.promoted && post.originalLink;
  let contentOrNil;
  if (!compact || hasExpandedCompact) {
    contentOrNil = (
      <PostContent
        post={ post }
        editing={ editing }
        editPending={ editPending }
        single={ single }
        compact={ compact }
        expandedCompact={ hasExpandedCompact }
        onTapExpand={ toggleExpanded }
        onToggleEdit={ onToggleEdit }
        onUpdateSelftext={ onUpdateSelftext }
        width={ winWidth }
        showNSFW={ showNSFW }
        toggleShowNSFW={ toggleShowNSFW }
        forceHTTPS={ forceHTTPS }
        isDomainExternal={ externalDomain }
        renderMediaFullbleed={ renderMediaFullbleed }
        showLinksInNewTab={ showLinksInNewTab }
      />
    );
  }

  const postCssClass = `Post ${compact ? 'size-compact' : 'size-default'}`;

  return (
    <article className={ postCssClass } style={ { zIndex: z} }>
      <div className='Post__header-wrapper'>
        { thumbnailOrNil }
        <PostHeader
          post={ post }
          isPromotedUserPost={ isPromotedUserPost }
          single={ single }
          compact={ compact }
          hideSubredditLabel={ hideSubredditLabel }
          hideWhen={ hideWhen }
          nextToThumbnail={ !!thumbnailOrNil }
          showingLink={ !!(compact && !hasExpandedCompact && externalDomain) }
          renderMediaFullbleed={ renderMediaFullbleed }
          showLinksInNewTab={ showLinksInNewTab }
          onClickPostDescriptor={ onClickPostDescriptor }
          onClickTitle={ onClickTitle }
        />
      </div>
      { contentOrNil }
      <PostFooter
        user={ user }
        single={ single }
        compact={ compact }
        post={ post }
        viewComments={ !single }
        hideDownvote={ userActivityPage || post.archived }
        onToggleEdit={ onToggleEdit }
        onToggleSave={ onToggleSavePost }
        onToggleHide={ onToggleHidePost }
        onReportPost={ onReportPost }
        onClickComments={ onClickComments }
      />
    </article>
  );
}

const selector = createSelector(
  state => state.user,
  (_, props) => props.postId,
  (_, props) => props.single,
  (state, props) => props.forceCompact || state.compact,
  (state, props) => state.posts[props.postId],
  (state, props) => !!state.expandedPosts[props.postId],
  (state, props) => !!state.unblurredPosts[props.postId],
  (state, props) => state.editingText[props.postId],
  (user, postId, single, compact, post, expanded, unblurred, editingState) => {
    const editing = !!editingState;
    const editPending = editing && editingState.pending;

    return {
      user,
      postId,
      single,
      compact,
      post,
      expanded,
      unblurred,
      editing,
      editPending,
    };
  }
);

const mapDispatchToProps = (dispatch, { postId }) => ({
  toggleExpanded: () => dispatch(postActions.toggleExpanded(postId)),
  toggleShowNSFW: () => dispatch(postActions.toggleNSFWBlur(postId)),
  onToggleEdit: () => dispatch(postActions.toggleEdit(postId)),
  onUpdateSelftext: (newSelfText) => dispatch(postActions.updateSelfText(postId, newSelfText)),
  onToggleSavePost: () => dispatch(postActions.toggleSavePost(postId)),
  onToggleHidePost: () => dispatch(postActions.toggleHidePost(postId)),
  onReportPost: () => dispatch(reportingActions.report(postId)),
});

export default connect(selector, mapDispatchToProps)(Post);
