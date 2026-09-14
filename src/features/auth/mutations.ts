// src/features/auth/mutations.ts
import {useMutation} from '@tanstack/react-query'
import {login, verifyTwoFactor} from '../../api/auth'

export const useLoginMutation = () => useMutation({mutationFn: login})
export const useVerifyTwoFactorMutation = () =>
  useMutation({mutationFn: verifyTwoFactor})
