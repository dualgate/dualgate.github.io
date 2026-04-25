import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';

interface Props {
  onLogin: (email: string, token: string) => void;
}

export default function VerifyPage({ onLogin }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const email = (location.state as Record<string, unknown> | null)?.email as string | undefined;

  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) navigate('/', { replace: true });
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...digits];
    if (value.length > 1) {
      const chars = value.slice(0, 6).split('');
      chars.forEach((c, i) => { if (i < 6) next[i] = c; });
      setDigits(next);
      inputRefs.current[Math.min(chars.length, 5)]?.focus();
      if (chars.length === 6) submitCode(next.join(''));
      return;
    }
    next[index] = value;
    setDigits(next);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d)) submitCode(next.join(''));
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitCode = async (code: string) => {
    if (!email) return;
    setError('');
    setVerifying(true);
    try {
      const { token } = await api.verify(email, code);
      onLogin(email, token);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid code');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return;
    try {
      const res = await api.requestCode(email);
      setResendCooldown(res.cooldown || 60);
      setError('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length === 6) submitCode(code);
  };

  if (!email) return null;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">Enter Code</h1>
          <p className="mt-2 text-sm text-gray-400">
            Code sent to <span className="font-medium text-gray-200">{email}</span>
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={i === 0 ? 6 : 1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                autoFocus={i === 0}
                className="h-12 w-11 rounded-lg border border-gray-700 bg-gray-900 text-center text-lg
                  font-mono outline-none transition
                  focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            ))}
          </div>
          {error && <p className="text-center text-sm text-red-400">{error}</p>}
          {verifying && (
            <div className="flex justify-center">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            </div>
          )}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="w-full text-center text-sm text-gray-400 transition hover:text-gray-200
              disabled:cursor-not-allowed disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend (${resendCooldown}s)` : 'Resend code'}
          </button>
        </form>
        <button
          onClick={() => navigate('/', { replace: true })}
          className="block w-full text-center text-sm text-gray-500 hover:text-gray-300"
        >
          &larr; Different email
        </button>
      </div>
    </div>
  );
}
