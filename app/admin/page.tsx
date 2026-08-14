'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';

export default function Admin() {
  const [negocioId, setNegocioId] = useState<number | null>(null);
  const [instrucciones, setInstrucciones] = useState('');
  const [nombreBot, setNombreBot] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const router = useRouter();

  useEffect(() => {
    inicializar();
  }, []);

  const inicializar = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/login');
      return;
    }

    let { data: negocio } = await supabase
      .from('negocios')
      .select('id')
      .eq('auth_user_id', session.user.id)
      .single();

    // Si no existe aún, lo creamos usando los datos guardados en el registro
    if (!negocio) {
      const pendiente = localStorage.getItem('pendienteNegocio');
      if (!pendiente) {
        setMensaje('No se encontró ningún negocio asociado a este usuario');
        setCargando(false);
        return;
      }

      const { nombreNegocio, tipoNegocio } = JSON.parse(pendiente);

      const { data: nuevoNegocio, error: errorCrear } = await supabase
        .from('negocios')
        .insert({
          nombre: nombreNegocio,
          tipo_negocio: tipoNegocio,
          email: session.user.email,
          plan: 'basico',
          auth_user_id: session.user.id,
        })
        .select()
        .single();

      if (errorCrear || !nuevoNegocio) {
        setMensaje('Error al crear tu negocio: ' + errorCrear?.message);
        setCargando(false);
        return;
      }

      await supabase.from('chatbot_config').insert({
        negocio_id: nuevoNegocio.id,
        nombre_bot: `Asistente de ${nombreNegocio}`,
        instrucciones: `Eres el asistente virtual de ${nombreNegocio}, un negocio de tipo ${tipoNegocio}. Todavía no se han configurado horarios ni detalles específicos: indica amablemente que el negocio los añadirá pronto.`,
        activo: true,
      });

      localStorage.removeItem('pendienteNegocio');
      negocio = nuevoNegocio;
    }

    if (!negocio) {
      setMensaje('No se pudo determinar tu negocio');
      setCargando(false);
      return;
    }

    const negocioIdFinal = negocio.id;

    // Comprobar el estado de pago antes de dejar entrar
    const { data: negocioCompleto } = await supabase
      .from('negocios')
      .select('estado_pago')
      .eq('id', negocioIdFinal)
      .single();

    if (negocioCompleto?.estado_pago !== 'activo') {
      setMensaje('Tu cuenta está pendiente de activación. Nos pondremos en contacto contigo para completar el pago y activar tu chatbot.');
      setCargando(false);
      return;
    }

    setNegocioId(negocioIdFinal);

    const { data: config } = await supabase
      .from('chatbot_config')
      .select('instrucciones, nombre_bot')
      .eq('negocio_id', negocioIdFinal)
      .single();

    if (config) {
      setInstrucciones(config.instrucciones);
      setNombreBot(config.nombre_bot);
    }

    setCargando(false);
  };

  const guardarConfig = async () => {
    if (!negocioId) return;

    setGuardando(true);
    setMensaje('');

    const { error } = await supabase
      .from('chatbot_config')
      .update({ instrucciones, nombre_bot: nombreBot })
      .eq('negocio_id', negocioId);

    setGuardando(false);
    setMensaje(error ? 'Error al guardar' : 'Guardado correctamente ✓');
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (cargando) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F7F2EA', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'sans-serif', color: '#8A7D65',
      }}>
        Cargando...
      </div>
    );
  }

  if (!negocioId) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F7F2EA', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontFamily: 'sans-serif', color: '#C8763F', textAlign: 'center', padding: 20,
      }}>
        {mensaje || 'No se encontró tu negocio'}
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#F7F2EA', fontFamily: 'sans-serif',
      display: 'flex', justifyContent: 'center', padding: '50px 20px',
    }}>
      <div style={{
        width: '100%', maxWidth: 600, background: '#FFFFFF', borderRadius: 20,
        boxShadow: '0 8px 30px rgba(60, 40, 20, 0.12)', overflow: 'hidden',
      }}>
        <div style={{
          background: '#5B6E4F', padding: '24px 28px', color: '#FFF',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 'bold', fontFamily: 'Georgia, serif' }}>
              Panel de administración
            </div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
              Configura cómo responde tu chatbot
            </div>
          </div>
          <button
            onClick={cerrarSesion}
            style={{
              background: 'transparent', border: '1px solid rgba(255,255,255,0.5)',
              color: '#FFF', borderRadius: 10, padding: '6px 12px',
              fontSize: 13, cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
        </div>

        <div style={{ padding: 28 }}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 'bold', color: '#5B6E4F' }}>
            NOMBRE DEL CHATBOT
          </label>
          <input
            value={nombreBot}
            onChange={(e) => setNombreBot(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              border: '1px solid #E0D5C0', outline: 'none', fontSize: 14,
              color: '#3D3427', boxSizing: 'border-box',
            }}
          />

          <label style={{ display: 'block', marginTop: 22, marginBottom: 6, fontSize: 13, fontWeight: 'bold', color: '#5B6E4F' }}>
            INSTRUCCIONES (horarios, menú, tono, políticas de reserva...)
          </label>
          <textarea
            value={instrucciones}
            onChange={(e) => setInstrucciones(e.target.value)}
            rows={10}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: 12,
              border: '1px solid #E0D5C0', outline: 'none', fontSize: 14,
              color: '#3D3427', lineHeight: 1.5, boxSizing: 'border-box',
              resize: 'vertical', fontFamily: 'sans-serif',
            }}
          />

          <button
            onClick={guardarConfig}
            disabled={guardando}
            style={{
              marginTop: 18, background: '#C8763F', color: '#FFF', border: 'none',
              borderRadius: 12, padding: '10px 22px', fontSize: 14, fontWeight: 'bold',
              cursor: guardando ? 'default' : 'pointer', opacity: guardando ? 0.7 : 1,
            }}
          >
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>

          {mensaje && <p style={{ marginTop: 14, fontSize: 14, color: '#5B6E4F' }}>{mensaje}</p>}
        </div>
      </div>
    </div>
  );
}