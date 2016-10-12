import React from 'react';
import './styles.less';

import config from 'config';
import makeRequest from 'lib/makeRequest';
import { PrivateAPI } from '@r/private';

import LoginInput from 'app/components/LoginRegistrationForm/Input';
import SquareButton from 'app/components/LoginRegistrationForm/SquareButton';

const EmailWarning = 'Unfortunately if you have never given us your email,' +
                     ' we will not be able to reset your password';

const SUCCESS_MSG = 'We sent a password reset email associated with that ' +
                    'account. Please check your inbox for instructions.';

const ERRORS = {
  EMPTY_INPUT: 'Please enter in a username',
  USER_DOESNT_EXIST: 'Sorry, this user does not exist.',
  NO_EMAIL_FOR_USER: 'Sorry, there is no email for this user.',
  RATELIMIT: 'Sorry, you are doing that too much.',
  504: 'Sorry, it took too long for the server to respond',
  500: 'Sorry, something has gone wrong with the server',
  DEFAULT: 'Sorry, Something has gone wrong and we\'re not sure what',
};

class ForgotPassword extends React.Component {

  constructor = (props) => {
    super(props);

    this.state = {
      error: null,
      name: '',
      success: false,
    };

  }

  submitForm = e => {
    e.preventDefault();
    const { name } = this.state;

    if (name) {
      this.requestReset(name);
    } else {
      this.setState({ error: 'EMPTY_INPUT' });
    }
  }

  async function requestReset(name) {
    try {
      const res = await PrivateAPI.forgotPassword(config.nonAuthAPIOrigin, postData);

      if (res) {
        this.setState({ success: true });
      }
    } catch (e) {
      this.setState({ error: e.name || e.status || 'DEFAULT' });
    }
  }

  updateName = e => {
    const name = e ? e.target.value : '';

    this.setState({ name, error: '', success: false });
  }

  renderClear = () => {
    return (
      <button
        type='button'
        className='login__input-action-btn'
        onClick={ this.clear }
      >
        <span className='icon icon-x' />
      </button>
    );
  }

  clear = () => {
    this.updateName(null);
  }

  render = () => {
    const { name, error, success } = this.state;

    return (
      <div>
        <h2 className='ForgotPassword__header'>Forgot Password</h2>
        <form action='/resetpassword' method='POST' >
          <LoginInput
            showTopBorder={ true }
            name='name'
            placeholder='Username'
            value={ name }
            onChange={ this.updateName }
            error={ ERRORS[error] }
          >
            { error ? this.renderClear() : null }
          </LoginInput>
          <p className='ForgotPassword__warning'>{ EmailWarning }</p>
          { success ? <p>{ SUCCESS_MSG }</p> : null }
          <div className='ForgotPassword__button'>
            <SquareButton onClick={ this.submitForm } text='Email Password Reset' />
          </div>
        </form>
      </div>
    );
  }
}

export default ForgotPassword;
