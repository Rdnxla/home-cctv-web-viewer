import {useMutation} from '@tanstack/react-query';
import {login, verifyTwoFactor} from './authApi';

export const useLoginMutation = () => useMutation({mutationFn: login});
export const useVerifyTwoFactorMutation = () => useMutation({mutationFn: verifyTwoFactor});
