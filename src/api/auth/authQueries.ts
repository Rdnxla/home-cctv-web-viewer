import {useMutation} from '@tanstack/react-query';
import {login, verifyTwoFactor} from './authApi';

const useLoginMutation = () => useMutation({mutationFn: login});
const useVerifyTwoFactorMutation = () => useMutation({mutationFn: verifyTwoFactor});

export {useLoginMutation, useVerifyTwoFactorMutation};
