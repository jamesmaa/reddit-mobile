import React from 'react';
import './styles.less';

import config from 'config';
import { DEFAULT_API_TIMEOUT } from 'app/constants';
import makeRequest from 'lib/makeRequest';

import LoginInput from 'app/components/LoginRegistrationForm/Input';
import SquareButton from 'app/components/LoginRegistrationForm/SquareButton';

const EmailWarning = 'Unfortunately if you have never given us your email,' +
                     ' we will not be able to reset your password';


const ERRORS = {
  USER_DOESNT_EXIST: 'Sorry, this user does not exist.',
  NO_EMAIL_FOR_USER: 'Sorry, there is no email for this user.',
  RATELIMIT: 'Sorry, you are doing that too much.',
  504: 'Sorry, it took too long for the server to respond',
  500: 'Sorry, something has gone wrong with the server',
  DEFAULT: 'Sorry, Something has gone wrong and we\'re not sure what',
};

class ForgotPassword extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      name: '',
    };

    this.submitForm = this.submitForm.bind(this);
    this.updateName = this.updateName.bind(this);
    this.makeRequest = this.makeRequest.bind(this);
    this.requestReset = this.requestReset.bind(this);
    this.renderClear = this.renderClear.bind(this);
    this.clear = this.clear.bind(this);
  }

  submitForm(e) {
    e.preventDefault();
    const name = this.state.name;

    if (name) {
      this.requestReset(name);
    }
  }

  async requestReset(name) {
    try {
      const uri = '/api/password.json';

      const postData = {
        name,
        api_type: 'json',
      };

      const res = await this.makeRequest(config.nonAuthAPIOrigin + uri, postData);

      if (res) {
        // show message
        this.props.close();
      }
    } catch (e) {
      this.setState({
        error: ERRORS[e.name] ||
               ERRORS[e.status] ||
               ERRORS.DEFAULT,
      });
    }
  }

  async makeRequest(uri, postData) {
    try {
      const res = await makeRequest
        .post(uri)
        .type('form')
        .send(postData)
        .timeout(DEFAULT_API_TIMEOUT)
        .then();

      const body = res.body;
      if (body && body.json && body.json.errors && body.json.errors.length) {
        const errArray = body.json.errors[0];
        const error = new Error(errArray[1]);
        error.name = errArray[0];
        throw error;
      }
      return res.body;
    } catch (e) {
      if (e.timeout) {
        e.name = 504;
      }
      throw e;
    }
  }

  updateName(e) {
    const name = e ? e.target.value : '';

    this.setState({ name, error: '' });
  }

  renderClear() {
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

  clear() {
    this.updateName(null);
  }

  render() {
    const { name, error } = this.state;

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
            error={ error }
          >
            { error && this.renderClear() }
          </LoginInput>
          <p className='ForgotPassword__warning'>{ EmailWarning }</p>
          <div className='ForgotPassword__button'>
            <SquareButton onClick={ this.submitForm } text='Email Password Reset' />
          </div>
        </form>
      </div>
    );
  }
}

export default ForgotPassword;
