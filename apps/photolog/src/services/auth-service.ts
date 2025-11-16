import { Amplify } from 'aws-amplify';
import { signIn, SignInOutput, signUp, SignUpOutput, confirmSignUp, ConfirmSignUpOutput } from '@aws-amplify/auth';
import { BEStack } from '../../outputs.json';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: BEStack.AuthConstructUserPoolIdE22F6EE5,
      userPoolClientId: BEStack.AuthConstructUserPoolClientIdA88338FC,
    },
  },
});

export class AuthService {
  private user: SignInOutput | undefined;

  public async login(
    userName: string,
    password: string
  ): Promise<SignInOutput | undefined> {
    try {
      this.user = await signIn({
        username: userName,
        password: password,
        options: {
          authFlowType: 'USER_PASSWORD_AUTH',
        },
      });
      return this.user;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async register(
    userName: string,
    password: string,
    email: string
  ): Promise<SignUpOutput | undefined> {
    try {
      const result = await signUp({
        username: userName,
        password: password,
        options: {
          userAttributes: {
            email: email,
          },
        },
      });
      return result;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }

  public async confirmRegistration(
    userName: string,
    confirmationCode: string
  ): Promise<ConfirmSignUpOutput | undefined> {
    try {
      const result = await confirmSignUp({
        username: userName,
        confirmationCode: confirmationCode,
      });
      return result;
    } catch (error) {
      console.error(error);
      return undefined;
    }
  }
}
