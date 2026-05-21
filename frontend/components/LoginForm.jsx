'use client';
import { useState } from 'react';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default function LoginForm(){
  const [email, setEmail] = useState('admin@navar.local');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event){
    event.preventDefault();
    setLoading(true);
    setError('');
    try{
      const response = await fetch(API_URL + '/api/auth/login', {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ email, password })
      });
      const data = await response.json();
      if(!response.ok) throw new Error(data.error || 'Login failed');
      localStorage.setItem('navarAdminToken', data.token);
      localStorage.setItem('navarAdmin', JSON.stringify(data.admin));
      window.location.href = '/dashboard';
    }catch(err){
      setError(err.message);
    }finally{
      setLoading(false);
    }
  }
  return <form className="loginCard" onSubmit={submit}>
    <div><span className="loginBrand">NavAR</span><h1>Sign in</h1><p>Use a role-based account to access the NavAR console.</p></div>
    <label>Email<input value={email} onChange={event=>setEmail(event.target.value)} type="email" autoComplete="email" required /></label>
    <label>Password<input value={password} onChange={event=>setPassword(event.target.value)} type="password" autoComplete="current-password" required /></label>
    {error && <strong className="loginError">{error}</strong>}
    <button type="submit" disabled={loading}>{loading ? 'Signing in...' : 'Sign in'}</button>
    <small>Samples: admin@navar.local / Admin@12345 · facility@navar.local / Facility@12345 · analyst@navar.local / Analyst@12345</small>
  </form>;
}
