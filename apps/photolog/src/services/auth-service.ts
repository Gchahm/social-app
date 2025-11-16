import { Amplify } from 'aws-amplify';
import { signIn, SignInOutput } from '@aws-amplify/auth';
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
}
