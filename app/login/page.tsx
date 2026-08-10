'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const iniciarSesion = async () => {
    setCargando(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setCargando(false);

    if (error) {
      setError('Email o contraseña incorrectos');
      return;
    }

    router.push('/admin');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F2EA',
      fontFamily: 'sans-serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 8px 30px rgba(60, 40, 20, 0.12)',
        padding: 32,
      }}>
        <h1 style={{ fontSize: 22, fontFamily: 'Georgia, serif', color: '#5B6E4F', marginBottom: 24 }}>
          Acceso al panel
        </h1>

        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 'bold', color: '#5B6E4F' }}>
          EMAIL
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 12,
            border: '1px solid #E0D5C0', outline: 'none', fontSize: 14,
            color: '#3D3427', boxSizing: 'border-box',
          }}
        />

        <label style={{ display: 'block', marginTop: 16, marginBottom: 6, fontSize: 13, fontWeight: 'bold', color: '#5B6E4F' }}>
          CONTRASEÑA
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && iniciarSesion()}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 12,
            border: '1px solid #E0D5C0', outline: 'none', fontSize: 14,
            color: '#3D3427', boxSizing: 'border-box',
          }}
        />

        <button
          onClick={iniciarSesion}
          disabled={cargando}
          style={{
            marginTop: 20, width: '100%', background: '#C8763F', color: '#FFF',
            border: 'none', borderRadius: 12, padding: '12px', fontSize: 14,
            fontWeight: 'bold', cursor: cargando ? 'default' : 'pointer',
            opacity: cargando ? 0.7 : 1,
          }}
        >
          {cargando ? 'Entrando...' : 'Entrar'}
        </button>

        {error && <p style={{ marginTop: 14, fontSize: 14, color: '#C8763F' }}>{error}</p>}
      </div>
    </div>
  );
}