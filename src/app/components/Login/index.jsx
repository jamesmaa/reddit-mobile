import 'app/components/LoginRegistrationForm/styles.less';

import React from 'react';
import { connect } from 'react-redux';
import { createSelector } from 'reselect';
import { METHODS } from '@r/platform/router';
import { urlFromPage } from '@r/platform/pageUtils';
import { Form, Anchor, BackAnchor } from '@r/platform/components';

import * as sessionActions from 'app/actions/session';

import OverlayModal from 'app/components/OverlayModal';
import ForgotPassword from 'app/components/ForgotPassword';
import SnooIcon from 'app/components/SnooIcon';
import LoginInput from 'app/components/LoginRegistrationForm/Input';
import SquareButton from 'app/components/LoginRegistrationForm/SquareButton';


class Login extends React.Component {
  constructor (props) {
    super(props);

    this.state = {
      isPasswordField: true,
      isForgotPassword: false,
      password: '',
      username: '',
    };

    this.clearPassword = this.clearField.bind(this, 'password');
    this.clearUsername = this.clearField.bind(this, 'username');
    this.updatePassword = this.updateField.bind(this, 'password');
    this.updateUsername = this.updateField.bind(this, 'username');
    this.toggleEye = this.toggleEye.bind(this);
    this.toggleForgotPassword = this.toggleForgotPassword.bind(this);
  }

  toggleEye() {
    const { isPasswordField } = this.state;
    this.setState({ isPasswordField: !isPasswordField });
  }

  toggleForgotPassword(e) {
    const { isForgotPassword } = this.state;
    e.preventDefault();
    this.setState({ isForgotPassword: !isForgotPassword });
  }

  clearField(fieldName, e) {
    const { resetSessionError } = this.props;
    e.preventDefault();
    this.setState({ [fieldName]: '' }, resetSessionError);
  }

  updateField(fieldName, e) {
    e.preventDefault();
    this.setState({ [fieldName]: e.target.value });
  }

  getGoBackDest() {
    const { platform } = this.props;
    let i = platform.currentPageIndex - 1;
    let prevPage = platform.history[i];
    // Find the first url in history that isn't either login or register
    while (i > 0 &&
           (prevPage.url === '/login' || prevPage.url === '/register')) {
      i--;
      prevPage = platform.history[i];
    }
    // Found a valid page if the last page not equal login or regist
    // else revert to frontpage
    if (i > 0 && !(prevPage.url === '/login' || prevPage.url === '/register')) {
      return urlFromPage(prevPage);
    }
    return '/';
  }

  renderClear(methodName) {
    return (
      <button
        type='button'
        className='Login__input-action-btn'
        onClick={ this[methodName] }
      >
        <span className='icon icon-x red' />
      </button>
    );
  }

  renderEye() {
    const { isPasswordField } = this.state;
    const blue = isPasswordField ? '' : 'blue';

    return (
      <button
        type='button'
        className='Login__input-action-btn'
        onClick={ this.toggleEye }
      >
        <span className={ `icon icon-eye ${blue}` } />
      </button>
    );
  }

  renderForgotPasswordModal() {
    return (
      <OverlayModal close={ this.toggleForgotPassword }>
        <ForgotPassword />
      </OverlayModal>
    );
  }

  render() {
    const { session } = this.props;
    const { isForgotPassword, isPasswordField, password, username } = this.state;
    const passwordFieldType = isPasswordField ? 'password' : 'text';
    const goBackDest = this.getGoBackDest();
    const errorType = session ? session.error : null;

    const error = { username: '', password: '' };
    if (errorType) {
      error.password = 'Sorry, that’s not the right password';
    }

    return (
      <div className='Login'>
        { isForgotPassword && this.renderForgotPasswordModal() }
        <div className='Register__header'>
          <BackAnchor
            className='Register__close icon icon-x'
            href={ goBackDest }
          />
        </div>
        <SnooIcon />
        <div className='Login__register-link'>
          <p>
            <Anchor href='/register'> New user? Sign up! </Anchor>
          </p>
        </div>
        <Form
          className='Login__form'
          method={ METHODS.POST }
          action='/login'
        >
          <LoginInput
            name='username'
            type='text'
            placeholder='Username'
            showTopBorder={ true }
            error={ error.username }
            onChange={ this.updateUsername }
            value={ username }
          >
            {
              error.username
              ? this.renderClear('clearUsername')
              : null
            }
          </LoginInput>
          <LoginInput
            name='password'
            type={ passwordFieldType }
            placeholder='Password'
            showTopBorder={ false }
            shouldAutocomplete={ false }
            error={ error.password }
            onChange={ this.updatePassword }
            value={ password }
          >
            {
              error.password
              ? this.renderClear('clearPassword')
              : this.renderEye()
            }
          </LoginInput>
          <a onClick={ this.toggleForgotPassword }>
            Forgot Password?
          </a>
          <div className='Login__submit'>
            <SquareButton text='LOG IN' type='submit'/>
          </div>
        </Form>
    </div>
    );
  }
}

const mapStateToProps = createSelector(
  state => state.session,
  state => state.platform,
  (session, platform) => ({ session, platform }),
);

const mapDispatchToProps = (dispatch) => ({
  resetSessionError: () => {
    dispatch(sessionActions.sessionError(null));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(Login);
