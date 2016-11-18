import './styles.less';
import React from 'react';
import URL from 'url';

import { models } from '@r/api-client';
const { PostModel } = models;

import mobilify from 'lib/mobilify';
import gifToHTML5Sources from 'lib/gifToHTML5Sources';
import { posterForHrefIfGiphyCat } from 'lib/gifToHTML5Sources';

import EditForm from 'app/components/EditForm';
import RedditLinkHijacker from 'app/components/RedditLinkHijacker';
import OutboundLink from 'app/components/OutboundLink';


import {
  isPostNSFW,
  cleanPostDomain,
  cleanPostHREF,
} from '../postUtils';

import {
  limitAspectRatio,
  aspectRatioClass,
  findPreviewImage,
  DEFAULT_ASPECT_RATIO,
} from '../mediaUtils';

const T = React.PropTypes;

function autoPlayGif(gif) {
  if (!gif) {
    return;
  }

  // need this to make iOS really autoplay the gif
  gif.play();
}

function forceProtocol(url, https) {
  const urlObj = URL.parse(url);
  urlObj.protocol = https ? 'https:' : urlObj.protocol;
  return URL.format(urlObj);
}

// NOTE: Playable Type and LinkDescriptor will move into the new
// representation for PostMediaState (temporary name) once that's
// refactored out into its own real file
const PLAYABLE_TYPE = {
  GALLERY: 'gallery',
  INLINE: 'inline',
  NOT_PLAYABLE: 'not-playable',
};

function postToPlayableType(post) {
  const media = post.media;
  if (media && media.oembed) {
    const type = media.oembed.type;
    if (type === 'gallery') {
      return PLAYABLE_TYPE.GALLERY;
    } else if (type === 'rich' && media.oembed.provider_name.toLowerCase() === 'imgur') {
      return PLAYABLE_TYPE.GALLERY;
    } else if (type !== 'image') {
      return PLAYABLE_TYPE.INLINE;
    }
  }

  if (post.url && post.url.indexOf('.gif') > -1) {
    return PLAYABLE_TYPE.INLINE;
  }

  return PLAYABLE_TYPE.NOT_PLAYABLE;
}

class LinkDescriptor {
  constructor(url, outbound) {
    this.url = url;
    this.outbound = outbound;
  }
}

// PostContent is used to render:
//  * Post thumbnail, if there is one
//  * Post Preview/Link Bar (includes playable gif / video / gallery etc)

export default class PostContent extends React.Component {
  static propTypes = {
    post: T.instanceOf(PostModel),
    compact: T.bool.isRequired,
    single: T.bool.isRequired,
    onTapExpand: T.func.isRequired,
    expandedCompact: T.bool.isRequired,
    width: T.number.isRequired,
    toggleShowNSFW: T.func.isRequired,
    showNSFW: T.bool.isRequired,
    editing: T.bool,
    editPending: T.bool,
    onAdClickContent: T.func,
    onToggleEdit: T.func.isRequired,
    onUpdateSelftext: T.func.isRequired,
    forceHTTPS: T.bool.isRequired,
    isDomainExternal: T.bool.isRequired,
    renderMediaFullbleed: T.bool.isRequired,
  };

  static defaultProps = {
    editing: false,
    editPending: false,
    onAdClickContent: () => {},
  };

  constructor(props) {
    super(props);


    this.state = {
      playing: props.expandedCompact, // we want things to autoplay in expanded compact mode
    };

    this.togglePlaying = this.togglePlaying.bind(this);
  }

  togglePlaying = e => {
    e.preventDefault();
    this.setState({ playing: !this.state.playing });
  }

  useOurOwnPlayingOrPreviewing(oembed, url) {
    if (!this.state.playing || !oembed) {
      return true;
    }

    // we want to use our own previewing for gifs which will be
    // type 'video', so make sure we don't accidently catch
    // anything else like an imgur gallery (type 'rich')
    if (oembed.type !== 'video') { return false; }

    const provider = oembed.provider_name.toLowerCase();
    return (provider === 'gfycat' || provider === 'imgur' || /\.gif$/.test(url));
  }

  isCompact() {
    const props = this.props;
    return props.compact && !props.expandedCompact;
  }

  needsNSFWBlur(isNSFW, showNSFW) {
    return isNSFW && !showNSFW;
  }

  getAspectRatio(single, width, height) {
    if (width && height) {
      return single ? width / height : limitAspectRatio(width / height);
    }

    return DEFAULT_ASPECT_RATIO;
  }

  render() {
    const isCompact = this.isCompact();
    const { single, post, isDomainExternal } = this.props;

    const linkUrl = cleanPostHREF(mobilify(post.cleanUrl));
    const linkDescriptor = new LinkDescriptor(linkUrl, true);
    const mediaContentNode = this.buildMediaContent(post, isCompact, linkDescriptor);
    const selftextNode = this.buildSelfTextContent(post, isCompact, single);

    if (!mediaContentNode && !selftextNode) {
      if (!isDomainExternal || isCompact) {
        // When in compact mode, the PostHeader Component is responsible for rendering
        // outbound links. But when in list mode, we are, so make sure we render
        // the linkbar to outbound links if needed.
        return null;
      }
    }

    return (
      <div className={ `PostContent ${isCompact ? 'size-compact' : 'size-default'}` }>
        { this.renderMediaContent(
          mediaContentNode, isCompact, isDomainExternal, cleanPostDomain(post.domain),
          linkUrl) }
        { selftextNode }
      </div>
    );
  }

  renderMediaContent(mediaContentNode, isCompact, isDomainExternal, linkDisplayText, linkUrl) {
    if (isCompact || !isDomainExternal || this.props.renderMediaFullbleed) {
      return mediaContentNode;
    }

    return (
      <div className='PostContent__media-wrapper'>
        { mediaContentNode }
        { this.renderLinkBar(linkDisplayText, linkUrl) }
      </div>
    );
  }

  buildSelfTextContent(post, isCompact, single) {
    if (isCompact || !single) { return; }

    if (this.props.editing) {
      return this.renderTextEditor(post.selfTextMD);
    }

    if (!post.selfTextHTML) { return; }

    const mobileSelfText = mobilify(post.expandedContent);
    return (
      <RedditLinkHijacker>
        <div
          className='PostContent__selftext'
          dangerouslySetInnerHTML={ { __html: mobileSelfText } }
        />
      </RedditLinkHijacker>
    );
  }

  renderTextEditor(rawMarkdown) {
    const { editPending, onToggleEdit, onUpdateSelftext } = this.props;

    return (
      <EditForm
        startingText={ rawMarkdown }
        editPending={ editPending }
        onCancelEdit={ onToggleEdit }
        onSaveEdit={ onUpdateSelftext }
      />
    );
  }

  buildMediaContent(post, isCompact, linkDescriptor) {
    const oembed = post.media ? post.media.oembed : null;

    if (isCompact && !(post.preview || oembed)) {
      return null; // Compact mode only renders thumbnails _if_ there's a preview
    }

    const { width, showNSFW } = this.props;
    const isNSFW = isPostNSFW(post);
    const needsNSFWBlur = this.needsNSFWBlur(isNSFW, showNSFW);
    const playableType = postToPlayableType(post);

    let previewImage;
    if (post.preview || oembed) {
      previewImage = findPreviewImage(
        isCompact, post.preview, post.thumbnail, oembed, width, needsNSFWBlur);
    }

    // if we got a preview image that's a gif, convert it to a still image if possible
    if (previewImage && previewImage.url) {
      const html5VideoSources = gifToHTML5Sources(previewImage.url);
      if (html5VideoSources && html5VideoSources.poster) {
        previewImage.url = html5VideoSources.poster;
      }
    }

    const { onTapExpand } = this.props;
    let callOnTapExpand;
    if (post.promoted && !post.isSelf) {
      // ads without self text should go to the url instead of expando
      callOnTapExpand = null;
    } else {
      callOnTapExpand = e => {
        e.preventDefault();
        onTapExpand();
      };
    }
 
    const sourceURL = post.cleanUrl;

    if (isCompact && previewImage && previewImage.url) {
      // the thumbnail
      return this.renderImage(previewImage, sourceURL, linkDescriptor, callOnTapExpand,
        needsNSFWBlur, true, playableType);
    }

    // handles:
    //  * image preview of playabe image / video
    //  * a gif that we're playing ourselves with html5 video or inline
    if (playableType !== PLAYABLE_TYPE.NOT_PLAYABLE
          && previewImage && this.useOurOwnPlayingOrPreviewing(oembed, sourceURL)) {
      return this.buildImagePreview(previewImage, sourceURL, linkDescriptor,
        this.togglePlaying, needsNSFWBlur, isCompact, playableType);
    }

    if (oembed) {
      return this.buildMediaPreview(post, sourceURL, oembed);
    }

    if (previewImage) {
      const callback = isNSFW ? e => { e.preventDefault(); this.props.toggleShowNSFW(); } : null;
      return this.buildImagePreview(
        previewImage, sourceURL, linkDescriptor, callback, needsNSFWBlur, isCompact, playableType);
    }
  }

  buildImagePreview(previewImage, imageURL, linkDescriptor, callback, needsNSFWBlur,
      isCompact, playableType) {
    const html5sources = gifToHTML5Sources(imageURL);
    const { single } = this.props;

    if (this.state.playing && html5sources) {
      const aspectRatio = this.getAspectRatio(single, previewImage.width, previewImage.height);

      if (html5sources.iframe) {
        return this.renderIframe(html5sources.iframe, aspectRatio);
      }

      const generatedSrc = {
        webm: html5sources.webm,
        mp4: html5sources.mp4,
        width: previewImage.width,
        height: previewImage.height,
      };

      return this.renderVideo(generatedSrc, html5sources.poster, aspectRatio);
    }

    return this.renderImage(previewImage, imageURL, linkDescriptor, callback,
      needsNSFWBlur, isCompact, playableType);
  }

  buildMediaPreview(post, sourceURL, oembed) {
    const { single } = this.props.single;
    const aspectRatio = this.getAspectRatio(single, oembed.width, oembed.height);

    switch (oembed.type) {
      case 'image':
        return this.renderIframe(sourceURL, aspectRatio);
      case 'video':
        return this.renderRawHTML(post.expandedContent, aspectRatio);
      case 'rich':
        return this.renderRichOembed(oembed.html, aspectRatio);
    }
  }

  renderRichOembed(oembedHtml, aspectRatio) {
    const findSrc = oembedHtml.match(/src="([^"]*)/);

    if (findSrc && findSrc[1]) {
      const frameUrl = findSrc[1].replace('&amp;', '&');
      return this.renderIframe(frameUrl, aspectRatio);
    }
  }

  renderImage(previewImage, imageURL, linkDescriptor, onClick, needsNSFWBlur,
      isCompact, playableType) {
    let playbackControlNode;
    if (playableType && !needsNSFWBlur) {
      playbackControlNode = this.renderPlaybackIcon(playableType, isCompact);
    }

    let nsfwNode;
    if (needsNSFWBlur) {
      nsfwNode = this.renderNSFWWarning(isCompact);
    }

    const { single } = this.props;
    const aspectRatio = this.getAspectRatio(single, previewImage.width, previewImage.height);

    if (previewImage && previewImage.url && !aspectRatio) {
      return this.renderImageOfUnknownSize(
        previewImage.url, linkDescriptor, onClick, playbackControlNode, nsfwNode);
    }

    return this.renderImageWithAspectRatio(previewImage, imageURL, linkDescriptor,
      aspectRatio, onClick, isCompact, playbackControlNode, nsfwNode);
  }

  baseImageLinkClass(imageUrl, hasNSFWBlur) {
    return `PostContent__image-link ${hasNSFWBlur && !imageUrl ? 'placeholder' :''}`;
  }

  renderImageOfUnknownSize(imageURL, linkDescriptor, onClick, playbackControlNode, nsfwNode) {
    const linkClass = this.baseImageLinkClass(imageURL, !!nsfwNode);
    return (
      <OutboundLink
        className={ linkClass }
        href={ linkDescriptor.url }
        target={ this.props.showLinksInNewTab ? '_blank' : null }
        onClick={ onClick }
        outboundLink={ this.props.post.outboundLink }
      >
        <img className='PostContent__image-img' src={ imageURL } />
        { playbackControlNode }
        { nsfwNode }
      </OutboundLink>
    );
  }

  renderImageWithAspectRatio(previewImage, imageURL, linkDescriptor, aspectRatio,
      onClick, isCompact, playbackControlNode, nsfwNode) {
    const { forceHTTPS } = this.props;

    const style = {};

    if (previewImage.url) {
      const giphyPosterHref = posterForHrefIfGiphyCat(imageURL);
      const backgroundImage = giphyPosterHref && !nsfwNode ? giphyPosterHref : previewImage.url;
      style.backgroundImage = `url("${forceProtocol(backgroundImage, forceHTTPS)}")`;
    }

    let linkClass = this.baseImageLinkClass(previewImage.url, !!nsfwNode);
    if (!isCompact) {
      linkClass += ` ${aspectRatioClass(aspectRatio)}`;
    }

    const isPlaying = this.state.playing && playbackControlNode; // make sure we're
    // really playing as opposed to showing the expanded compact version of the image
    return (
      <OutboundLink
        className={ linkClass }
        href={ linkDescriptor.url }
        target={ this.props.showLinksInNewTab ? '_blank' : null }
        onClick={ onClick }
        style={ style }
        outboundLink={ this.props.post.outboundLink }
      >
        { isPlaying
          ? <img className='PostContent__inline-gif' src={ imageURL } />
          : playbackControlNode }
        { nsfwNode }
      </OutboundLink>
    );
  }

  renderIframe(src, aspectRatio) {
    return (
      <div className={ `PostContent__iframe-wrapper ${aspectRatioClass(aspectRatio)}` } >
        <iframe
          className='PostContent__iframe'
          src={ src }
          frameBorder='0'
          allowFullScreen=''
          sandbox='allow-scripts allow-forms allow-same-origin'
        />
      </div>
    );
  }

  renderVideo(videoSpec, posterImage, aspectRatio) {
    return (
      <div className={ `PostContent__video-wrapper ${aspectRatioClass(aspectRatio)}` } >
        <video
          className='PostContent__video'
          poster={ posterImage }
          loop='true'
          muted='true'
          controls='true'
          autoPlay='true'
          ref={ autoPlayGif }
        >
          { this.buildVideoSources(videoSpec) }
        </video>
      </div>
    );
  }

  buildVideoSources(videoSpec) {
    const sources = [];
    ['mp4', 'webm'].forEach(function(videoType) {
      const source = videoSpec[videoType];
      if (source) {
        sources.push(
          <source
            key={ `video-src-${videoType}` }
            type={ `video/${videoType}` }
            src={ source }
          />
        );
      }
    });

    return sources;
  }

  renderRawHTML(htmlContent, aspectRatio) {
    return (
      <RedditLinkHijacker>
        <div
          className={ `PostContent__html ${aspectRatioClass(aspectRatio)}` }
          dangerouslySetInnerHTML={ { __html: htmlContent } }
        />
      </RedditLinkHijacker>
    );
  }

  renderPlaybackIcon(playableType, isCompact) {
    if (playableType === PLAYABLE_TYPE.NOT_PLAYABLE) {
      return;
    }

    let iconCls = 'PostContent__playback-action-icon darkgrey';

    if (playableType === PLAYABLE_TYPE.GALLERY) {
      iconCls += ' icon icon-gallery_squares';
    } else if (playableType === PLAYABLE_TYPE.INLINE) {
      iconCls += ' icon icon-play_triangle';
    }

    const buttonCls = `PostContent__playback-action-circle  ${isCompact ? 'compact' : 'regular'}`;

    return (
      <div className={ buttonCls }>
        <span className={ iconCls } />
      </div>
    );
  }

  renderLinkBar(displayText, href) {
    const target = this.props.showLinksInNewTab ? '_blank' : null;

    return (
      <OutboundLink
        className='PostContent__link-bar'
        href={ href }
        target={ target }
        outboundLink={ this.props.post.outboundLink }
        onClick={ onAdClickContent }
      >
        <span className='PostContent__link-bar-text'>{ displayText }</span>
        <span className='PostContent__link-bar-icon icon icon-linkout blue' />
      </OutboundLink>
    );
  }

  renderNSFWWarning(isCompact) {
    if (isCompact) {
      return (
        <div className='PostContent__nsfw-warning'>
          <p className='PostContent__nsfw-warning-text'>NSFW</p>
        </div>
      );
    }

    return (
      <div className='PostContent__nsfw-warning'>
        <p className='PostContent__nsfw-warning-text'>This post is marked as NSFW</p>
        <p className='PostContent__nsfw-warning-button'>Show Post?</p>
      </div>
    );
  }
}
