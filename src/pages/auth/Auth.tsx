import './Auth.scss';
import type { AuthSuccess } from '@/api/auth/auth.types';
import {
  useLoginMutation,
  useVerifyTwoFactorMutation,
} from './model/useAuth';
import { ApiErrorCode } from '@/shared/api/authErrorCodes';
import { isApiError } from '@/shared/api/http';
import { Form } from 'radix-ui';
import { Button, TextField } from '@radix-ui/themes';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';

type Step =
  | { name: 'credentials' }
  | { name: '2fa'; tempToken: string };

export function Component() {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>({ name: 'credentials' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);

  const loginMutation = useLoginMutation();
  const twoFactorMutation = useVerifyTwoFactorMutation();

  const resetErrors = useCallback(() => {
    setFieldErrors({});
    setFormError(null);
    setLocked(false);
    setRetryAfter(null);
  }, []);

  const handleAuthSuccess = useCallback(
    (data: AuthSuccess) => {
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      navigate('/me');
    },
    [navigate],
  );

  const handleLoginSubmit = useCallback(
    (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();
      resetErrors();

      const formData = new FormData(event.currentTarget);
      const email = String(formData.get('email') ?? '');
      const password = String(formData.get('password') ?? '');

      loginMutation.mutate(
        { email, password },
        {
          onSuccess: (data) => {
            if ('requiresTwoFactor' in data) {
              setStep({
                name: '2fa',
                tempToken: data.tempToken,
              });
              return;
            }

            handleAuthSuccess(data);
          },

          onError: (err) => {
            if (!isApiError(err)) {
              setFormError(
                'Не удалось выполнить вход. Попробуйте ещё раз.',
              );
              return;
            }

            switch (err.code) {
              case ApiErrorCode.validationError:
                setFieldErrors(
                  (err.data.fieldErrors as Record<string, string>) ?? {},
                );
                break;

              case ApiErrorCode.invalidCredentials: {
                const remaining =
                  err.data.attemptsRemaining as number | undefined;

                setFormError(
                  remaining === null
                    ? err.message
                    : `${err.message} Осталось попыток: ${remaining}.`,
                );
                break;
              }

              case ApiErrorCode.accountLocked:
                setLocked(true);
                setFormError(err.message);
                break;

              case ApiErrorCode.emailNotVerified:
              case ApiErrorCode.passwordResetRequired:
                setFormError(err.message);
                break;

              case ApiErrorCode.rateLimited:
                setRetryAfter(30);
                setFormError(err.message);
                break;

              default:
                setFormError(
                  err.message || 'Не удалось выполнить вход.',
                );
            }
          },
        },
      );
    },
    [handleAuthSuccess, loginMutation, resetErrors],
  );

  const handleTwoFactorSubmit = useCallback(
    (event: React.SubmitEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (step.name !== '2fa') {
        return;
      }

      resetErrors();

      const formData = new FormData(event.currentTarget);
      const code = String(formData.get('code') ?? '');

      twoFactorMutation.mutate(
        {
          tempToken: step.tempToken,
          code,
        },
        {
          onSuccess: handleAuthSuccess,

          onError: (err) => {
            if (!isApiError(err)) {
              setFormError('Не удалось подтвердить код.');
              return;
            }

            if (err.code === ApiErrorCode.invalidSession) {
              setFormError('Сессия истекла. Войдите заново.');
              setStep({ name: 'credentials' });
              return;
            }

            setFormError(err.message);
          },
        },
      );
    },
    [
      handleAuthSuccess,
      resetErrors,
      step,
      twoFactorMutation,
    ],
  );

  useEffect(() => {
    if (retryAfter === null) {
      return;
    }

    if (retryAfter <= 0) {
      setRetryAfter(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      setRetryAfter((value) => (value ?? 0) - 1);
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [retryAfter]);

  if (step.name === '2fa') {
    return (
      <div className="auth-page">
        <Form.Root
          className="auth-form"
          onSubmit={handleTwoFactorSubmit}
        >
          <h1>Код подтверждения</h1>

          <p>
            Введите 6-значный код из приложения-аутентификатора.
          </p>

          <Form.Field className="form-field" name="code">
            <Form.Label className="form-label">
              Код
            </Form.Label>

            <Form.Control asChild={true}>
              <input
                className="form-input"
                inputMode="numeric"
                maxLength={6}
                pattern="[0-9]{6}"
                required={true}
                type="text"
              />
            </Form.Control>

            <Form.Message
              className="field-error"
              match="valueMissing"
            >
              Введите код.
            </Form.Message>

            <Form.Message
              className="field-error"
              match="patternMismatch"
            >
              Код должен состоять из 6 цифр.
            </Form.Message>
          </Form.Field>

          {formError !== null && (
            <p className="error" role="alert">
              {formError}
            </p>
          )}

          <Form.Submit asChild={true}>
            <button
              disabled={twoFactorMutation.isPending}
              type="submit"
            >
              {twoFactorMutation.isPending
                ? 'Проверка...'
                : 'Подтвердить'}
            </button>
          </Form.Submit>
        </Form.Root>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <Form.Root
        className="auth-form"
        onSubmit={handleLoginSubmit}
      >
        <h1>Вход</h1>

        <Form.Field
          className="form-field"
          name="email"
          serverInvalid={Boolean(fieldErrors.email)}
        >
          <Form.Label className="form-label">
            Email
          </Form.Label>

          <TextField.Root
            autoComplete="email"
            name="email"
            required
            type="email"
          />

          <Form.Message
            className="field-error"
            match="valueMissing"
          >
            Email обязателен.
          </Form.Message>

          <Form.Message
            className="field-error"
            match="typeMismatch"
          >
            Введите корректный email.
          </Form.Message>

          {fieldErrors.email ? (
            <span className="field-error">
              {fieldErrors.email}
            </span>
          ) : null}
        </Form.Field>

        <Form.Field
          className="form-field"
          name="password"
          serverInvalid={Boolean(fieldErrors.password)}
        >
          <Form.Label className="form-label">
            Пароль
          </Form.Label>

          <TextField.Root
            autoComplete="current-password"
            name="password"
            required
            type="password"
          />

          <Form.Message
            className="field-error"
            match="valueMissing"
          >
            Пароль обязателен.
          </Form.Message>

          {fieldErrors.password ? (
            <span className="field-error">
              {fieldErrors.password}
            </span>
          ) : null}
        </Form.Field>

        {formError ? (
          <p
            className={locked ? 'error error--locked' : 'error'}
            role="alert"
          >
            {formError}
          </p>
        ) : null}

        {retryAfter ? (
          <p className="hint">
            Повторите попытку через {retryAfter} сек.
          </p>
        ) : null}

        <Form.Submit asChild>
          <Button
            disabled={loginMutation.isPending || locked}
            type="submit"
          >
            {loginMutation.isPending ? 'Входим...' : 'Войти'}
          </Button>
        </Form.Submit>
      </Form.Root>
    </div>
  );
}
