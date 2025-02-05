'use client';
import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const router = useRouter();
  const [action, setAction] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document.cookie.includes('authToken=')) {
      router.push('/dashboard');
    }
  }, [router]);

  const setAuthCookie = (token: string) => {
    const maxAge = 7 * 24 * 60 * 60;
    document.cookie = `authToken=${token}; path=/; max-age=${maxAge}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          email,
          password,
          ...(action === 'register' ? { name } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Error occurred');
        return;
      }
      // On success, store the token in cookies and redirect
      setAuthCookie(data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(`Unexpected error occurred - ${err.message}`);
    }
  };

  return (
    <div className="flex min-h-full flex-1">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96 mt-20">
          <div className="text-center">
            <h2 className="mt-8 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              {action === 'login' ? 'Sign in to your account' : 'Create your account'}
            </h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {action === 'login'
                ? "Don't have an account? "
                : "Already have an account? "}
              <button
                onClick={() => setAction(action === 'login' ? 'register' : 'login')}
                className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-amber-600"
              >
                {action === 'login' ? 'Register now' : 'Sign in'}
              </button>
            </p>
          </div>

          <div className="mt-10 h-fit">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="text-sm text-red-600">{error}</div>
              )}
              {action === 'register' && (
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                    Name
                  </label>
                  <div className="mt-2">
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300 outline-1 outline-gray-300 dark:outline-gray-700 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
                    />
                  </div>
                </div>
              )}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300 outline-1 outline-gray-300 dark:outline-gray-700 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-900 dark:text-gray-100">
                  Password
                </label>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    className="block w-full rounded-md bg-white dark:bg-gray-800 px-3 py-1.5 text-base text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-300 outline-1 outline-gray-300 dark:outline-gray-700 focus:outline-2 focus:outline-indigo-600 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 dark:bg-amber-600 dark:text-black px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-2 focus:outline-offset-2 focus:outline-indigo-600"
                >
                  {action === 'login' ? 'Sign in' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block">
        <Image
          alt="Background"
          width={1000}
          height={1200}
          src="https://images.unsplash.com/photo-1496917756835-20cb06e75b4e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1908&q=80"
          className="absolute inset-0 h-screen w-full object-cover"
        />
      </div>
    </div>
  );
}