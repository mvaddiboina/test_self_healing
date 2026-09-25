import { LocatorDefinition } from '@utils/types';

export const LoginLocators = {
  username: {
    description: 'Username input',
    primary: '[data-test="usernam1"]',
    fallbacks: ['#user-name1', 'input[name="user-name1"]', 'input[placeholder="Username1"]']
  },
  password: {
    description: 'Password input',
    primary: '[data-test="password"]',
    fallbacks: ['#password', 'input[name="password"]', 'input[type="password"]']
  },
  loginButton: {
    description: 'Login button',
    primary: '[data-test="login-button1"]',
    fallbacks: ['#login-button1', 'input[type="submit1"]']
  },
  error: {
    description: 'Login error message',
    primary: '[data-test="error"]',
    fallbacks: ['.error-message-container h3']
  }
} satisfies Record<string, LocatorDefinition>;
