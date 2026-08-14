'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Signup() {
  const [nombreNegocio, setNombreNegocio] = useState('');
  const [tipoNegocio, setTipoNegocio] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  const registrar = async () => {
    if (!nombreNegocio || !tipoNegocio || !email || !password) {
      setError('Por favor, rellena todos los campos');
      return;
    }

    setCargando(true);
    setError('');

    const { data: authData, error: errorAuth } = await supabase.auth.signUp({
      email,
      password,
    });

    if (errorAuth || !authData.user) {
      setCargando(false);
      setError(errorAuth?.message || 'Error al crear la cuenta');
      return;
    }

    // Guardamos temporalmente los datos del negocio, se crearán cuando haya sesión activa
    localStorage.setItem('pendienteNegocio', JSON.stringify({ nombreNegocio, tipoNegocio }));

    setCargando(false);

    if (!authData.session) {
      setError('¡Cuenta creada! Revisa tu email para confirmar la cuenta antes de entrar.');
    } else {
      router.push('/admin');
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F2EA', fontFamily: 'sans-serif',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <div style={{
        width: '100%', maxWidth: 420, background: '#FFFFFF', borderRadius: 20,
        boxShadow: '0 8px 30px rgba(60, 40, 20, 0.12)', padding: 32,
      }}>
        <h1 style={{ fontSize: 22, fontFamily: 'Georgia, serif', color: '#5B6E4F', marginBottom: 24 }}>
          Registra tu negocio
        </h1>

        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 'bold', color: '#5B6E4F' }}>
          NOMBRE DEL NEGOCIO
        </label>
        <input
          value={nombreNegocio}
          onChange={(e) => setNombreNegocio(e.target.value)}
          placeholder="Ej: Restaurante La Buena Mesa"
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 12,
            border: '1px solid #E0D5C0', outline: 'none', fontSize: 14,
            color: '#3D3427', boxSizing: 'border-box',
          }}
        />

        <label style={{ display: 'block', marginTop: 16, marginBottom: 6, fontSize: 13, fontWeight: 'bold', color: '#5B6E4F' }}>
          TIPO DE NEGOCIO
        </label>
        <input
          value={tipoNegocio}
          onChange={(e) => setTipoNegocio(e.target.value)}
          placeholder="Ej: restaurante, farmacia, tienda..."
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 12,
            border: '1px solid #E0D5C0', outline: 'none', fontSize: 14,
            color: '#3D3427', boxSizing: 'border-box',
          }}
        />

        <label style={{ display: 'block', marginTop: 16, marginBottom: 6, fontSize: 13, fontWeight: 'bold', color: '#5B6E4F' }}>
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
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 12,
            border: '1px solid #E0D5C0', outline: 'none', fontSize: 14,
            color: '#3D3427', boxSizing: 'border-box',
          }}
        />

        <button
          onClick={registrar}
          disabled={cargando}
          style={{
            marginTop: 20, width: '100%', background: '#C8763F', color: '#FFF',
            border: 'none', borderRadius: 12, padding: '12px', fontSize: 14,
            fontWeight: 'bold', cursor: cargando ? 'default' : 'pointer',
            opacity: cargando ? 0.7 : 1,
          }}
        >
          {cargando ? 'Creando cuenta...' : 'Crear mi chatbot'}
        </button>

        {error && <p style={{ marginTop: 14, fontSize: 14, color: '#5B6E4F' }}>{error}</p>}
      </div>
    </div>
  );
}