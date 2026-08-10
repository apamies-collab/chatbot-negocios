import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../lib/supabase';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const herramientas: Anthropic.Tool[] = [
  {
    name: 'crear_reserva',
    description: 'Crea una reserva para un cliente cuando ya tienes todos los datos necesarios: nombre, número de personas, fecha y hora.',
    input_schema: {
      type: 'object',
      properties: {
        nombre_cliente: { type: 'string', description: 'Nombre del cliente que reserva' },
        fecha_reserva: { type: 'string', description: 'Fecha y hora de la reserva en formato ISO, ej: 2026-08-15T21:00:00' },
        detalles: { type: 'string', description: 'Detalles adicionales, ej: "mesa para 4 personas"' },
      },
      required: ['nombre_cliente', 'fecha_reserva', 'detalles'],
    },
  },
];

type MensajeHistorial = { autor: string; texto: string };

export async function POST(request: NextRequest) {
  try {
    const { mensaje, negocioId, historial } = await request.json();

    const { data: config, error: errorConfig } = await supabase
      .from('chatbot_config')
      .select('instrucciones, nombre_bot')
      .eq('negocio_id', negocioId)
      .eq('activo', true)
      .single();

    if (errorConfig || !config) {
      return NextResponse.json(
        { error: 'No se encontró configuración para este negocio' },
        { status: 404 }
      );
    }

    // Convertimos el historial (que viene de la página) al formato que espera Claude
    const historialClaude: Anthropic.MessageParam[] = (historial || []).map((m: MensajeHistorial) => ({
      role: m.autor === 'Tú' ? 'user' : 'assistant',
      content: m.texto,
    }));

    const mensajesCompletos: Anthropic.MessageParam[] = [
      ...historialClaude,
      { role: 'user', content: mensaje },
    ];

    let respuesta = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 500,
      system: `${config.instrucciones}\n\nLa fecha de hoy es ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Usa siempre el año correcto al crear reservas.`,
      tools: herramientas,
      messages: mensajesCompletos,
    });

    const usoHerramienta = respuesta.content.find(block => block.type === 'tool_use');

    let textoRespuesta = '';

    if (usoHerramienta && usoHerramienta.type === 'tool_use') {
      const datos = usoHerramienta.input as {
        nombre_cliente: string;
        fecha_reserva: string;
        detalles: string;
      };

      await supabase.from('reservas').insert({
        negocio_id: negocioId,
        nombre_cliente: datos.nombre_cliente,
        fecha_reserva: datos.fecha_reserva,
        detalles: datos.detalles,
        estado: 'pendiente',
      });

      const segundaRespuesta = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 500,
system: `${config.instrucciones}\n\nLa fecha de hoy es ${new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. Usa siempre el año correcto al crear reservas.`,        tools: herramientas,
        messages: [
          ...mensajesCompletos,
          { role: 'assistant', content: respuesta.content },
          {
            role: 'user',
            content: [{
              type: 'tool_result',
              tool_use_id: usoHerramienta.id,
              content: 'Reserva creada correctamente.',
            }],
          },
        ],
      });

      const bloqueTexto = segundaRespuesta.content.find(b => b.type === 'text');
      textoRespuesta = bloqueTexto && bloqueTexto.type === 'text' ? bloqueTexto.text : '';
    } else {
      const bloqueTexto = respuesta.content.find(b => b.type === 'text');
      textoRespuesta = bloqueTexto && bloqueTexto.type === 'text' ? bloqueTexto.text : '';
    }

    await supabase.from('conversaciones').insert({
      negocio_id: negocioId,
      mensaje: mensaje,
      respuesta: textoRespuesta,
    });

    return NextResponse.json({ respuesta: textoRespuesta });
  } catch (error) {
    console.error('Error llamando a la IA:', error);
    return NextResponse.json(
      { error: 'Hubo un problema al procesar tu mensaje' },
      { status: 500 }
    );
  }
}