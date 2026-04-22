// src/components/lots/EventTimeline.tsx
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { LotEvent } from '@/types'

const EVENT_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  planting:      { label: 'Plantio',        color: 'text-green-400',  dot: 'bg-green-400' },
  harvest:       { label: 'Colheita',       color: 'text-yellow-400', dot: 'bg-yellow-400' },
  transport:     { label: 'Transporte',     color: 'text-blue-400',   dot: 'bg-blue-400' },
  processing:    { label: 'Processamento',  color: 'text-purple-400', dot: 'bg-purple-400' },
  sale:          { label: 'Venda',          color: 'text-orange-400', dot: 'bg-orange-400' },
  certification: { label: 'Certificação',   color: 'text-cyan-400',   dot: 'bg-cyan-400' },
  inspection:    { label: 'Inspeção',       color: 'text-pink-400',   dot: 'bg-pink-400' },
}

interface EventTimelineProps {
  events: LotEvent[]
}

export default function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="text-[#4d7a4d] text-sm text-center py-4">
        Nenhum evento registrado ainda. Registre o plantio para começar a rastrear.
      </p>
    )
  }

  return (
    <div className="relative">
      {/* Linha vertical */}
      <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#2d3d2d]" />

      <div className="space-y-5">
        {events.map((event, index) => {
          const config = EVENT_CONFIG[event.type] ?? {
            label: event.type,
            color: 'text-gray-400',
            dot: 'bg-gray-400',
          }

          return (
            <div key={event.id} className="relative flex gap-4 pl-6">
              {/* Dot */}
              <div className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#172117] ${config.dot} shrink-0`} />

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`text-sm font-semibold ${config.color}`}>
                    {config.label}
                  </span>
                  <span className="text-xs text-[#4d7a4d]">
                    {format(new Date(event.date), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </div>

                {event.description && (
                  <p className="text-[#a0b8a0] text-sm mt-0.5">{event.description}</p>
                )}

                {/* Metadata extra do evento */}
                {event.metadata && Object.keys(event.metadata).length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {Object.entries(event.metadata).map(([k, v]) => (
                      <span key={k} className="text-xs bg-[#1e2e1e] text-[#6b8f6b] px-2 py-0.5 rounded-full">
                        {k}: {String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
