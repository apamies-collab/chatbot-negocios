'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function ChatNegocio() {
  const params = useParams();
  const negocioId = Number(params.negocioId);

  const [nombreNegocio, setNombreNegocio] = useState('');
  const [cargandoInfo, setCargandoInfo] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [conversacion, setConversacion] = useState<{ autor: string; texto: string }[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    cargarNombreNegocio();
  }, []);

  const cargarNombreNegocio = async () => {
    const { data } = await supabase
      .from('chatbot_config')
      .select('nombre_bot')
      .eq('negocio_id', negocioId)
      .single();

    if (data) setNombreNegocio(data.nombre_bot);
    setCargandoInfo(false);
  };

  const enviarMensaje = async () => {
    if (!mensaje.trim()) return;

    const mensajeUsuario = mensaje;
    const nuevaConversacion = [...conversacion, { autor: 'Tú', texto: mensajeUsuario }];
    setConversacion(nuevaConversacion);
    setMensaje('');
    setCargando(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensaje: mensajeUsuario,
          negocioId: negocioId,
          historial: nuevaConversacion.slice(0, -1),
        }),
      });

      if (!res.ok) throw new Error('Respuesta no válida');

      const data = await res.json();

      if (!data.respuesta) throw new Error('Respuesta vacía');

      setConversacion(prev => [...prev, { autor: 'Chatbot', texto: data.respuesta }]);
    } catch {
      setConversacion(prev => [...prev, {
        autor: 'Chatbot',
        texto: 'Disculpa, ha habido un problema para procesar tu mensaje. ¿Puedes intentarlo de nuevo?',
      }]);
    }

    setCargando(false);
  };

  if (cargandoInfo) {
    return <div style={{ padding: 40, fontFamily: 'sans-serif' }}>Cargando...</div>;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F2EA',
      fontFamily: 'Georgia, serif',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 480,
        background: '#FFFFFF',
        borderRadius: 20,
        boxShadow: '0 8px 30px rgba(60, 40, 20, 0.12)',
        overflow: 'hidden',
      }}>
        <div style={{ background: '#5B6E4F', padding: '20px 24px', color: '#FFF' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold' }}>{nombreNegocio || 'Chatbot'}</div>
          <div style={{ fontSize: 13, opacity: 0.85, fontFamily: 'sans-serif' }}>Suele responder al instante</div>
        </div>

        <div style={{ height: 420, overflowY: 'auto', padding: 20, background: '#FBF8F3', fontFamily: 'sans-serif' }}>
          {conversacion.length === 0 && (
            <div style={{ color: '#A0947F', fontSize: 14, textAlign: 'center', marginTop: 40 }}>
              Escribe un mensaje para empezar la conversación
            </div>
          )}

          {conversacion.map((m, i) => {
            const esUsuario = m.autor === 'Tú';
            return (
              <div key={i} style={{ display: 'flex', justifyContent: esUsuario ? 'flex-end' : 'flex-start', marginBottom: 12 }}>
                <div style={{
                  maxWidth: '75%', padding: '10px 14px', borderRadius: 16,
                  borderBottomRightRadius: esUsuario ? 4 : 16,
                  borderBottomLeftRadius: esUsuario ? 16 : 4,
                  background: esUsuario ? '#C8763F' : '#EAE3D6',
                  color: esUsuario ? '#FFF' : '#3D3427',
                  fontSize: 14.5, lineHeight: 1.4,
                }}>
                  {m.texto}
                </div>
              </div>
            );
          })}

          {cargando && <div style={{ color: '#A0947F', fontSize: 13, fontStyle: 'italic' }}>Escribiendo...</div>}
        </div>

        <div style={{ display: 'flex', gap: 8, padding: 16, borderTop: '1px solid #EEE6D8', background: '#FFF', fontFamily: 'sans-serif' }}>
          <input
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
            placeholder="Escribe un mensaje..."
            style={{ flex: 1, padding: '10px 14px', borderRadius: 12, border: '1px solid #E0D5C0', outline: 'none', fontSize: 14, color: '#3D3427' }}
          />
          <button
            onClick={enviarMensaje}
            style={{ background: '#5B6E4F', color: '#FFF', border: 'none', borderRadius: 12, padding: '0 18px', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  );
}