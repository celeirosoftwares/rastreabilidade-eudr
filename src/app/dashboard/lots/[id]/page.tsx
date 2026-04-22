// src/app/dashboard/lots/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Layers, Calendar, Package, Plus } from 'lucide-react'
import { getLotById } from '@/lib/actions/lots'
import EventTimeline from '@/components/lots/EventTimeline'
import AddEventForm from '@/components/lots/AddEventForm'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const CROP_LABELS: Record<string, { label: string; emoji: string }> = {
  coffee:    { label: 'Café',           emoji: '☕' },
  soy:       { label: 'Soja',           emoji: '🌱' },
  sugarcane: { label: 'Cana-de-açúcar', emoji: '🌾' },
  corn:      { label: 'Milho',          emoji: '🌽' },
  cotton:    { label: 'Algodão',        emoji: '🤍' },
  other:     { label: 'Outro',          emoji: '🌿' },
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active:    { label: 'Ativo',     color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  harvested: { label: 'Colhido',   color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  sold:      { label: 'Vendido',   color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  archived:  { label: 'Arquivado', color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' },
}

function renderMetadata(cropType: string, metadata: Record<string, unknown>) {
  const items: { label: string; value: string }[] = []

  if (cropType === 'coffee') {
    const proc: Record<string, string> = {
      natural: 'Natural (Seco)',
      washed: 'Lavado (Úmido)',
      honey: 'Honey',
      pulped_natural: 'Despolpado Natural',
    }
    if (metadata.processing_type) items.push({ label: 'Processamento', value: proc[metadata.processing_type as string] ?? String(metadata.processing_type) })
    if (metadata.quality_score)   items.push({ label: 'Pontuação SCA', value: `${metadata.quality_score} pts` })
    if (metadata.variety)         items.push({ label: 'Variedade', value: String(metadata.variety) })
    if (metadata.altitude_meters) items.push({ label: 'Altitude', value: `${metadata.altitude_meters} m` })
    if (metadata.bags_quantity)   items.push({ label: 'Sacas', value: String(metadata.bags_quantity) })
    if (metadata.bag_weight_kg)   items.push({ label: 'Peso/saca', value: `${metadata.bag_weight_kg} kg` })
  }

  if (cropType === 'soy') {
    if (metadata.volume_tons)      items.push({ label: 'Volume', value: `${metadata.volume_tons} t` })
    if (metadata.storage_location) items.push({ label: 'Armazenamento', value: String(metadata.storage_location) })
    items.push({ label: 'Transgênico (GMO)', value: metadata.gmo ? 'Sim' : 'Não' })
  }

  if (cropType === 'sugarcane') {
    const dest: Record<string, string> = { sugar: 'Açúcar', ethanol: 'Etanol', both: 'Ambos' }
    if (metadata.destination)  items.push({ label: 'Destino', value: dest[metadata.destination as string] ?? String(metadata.destination) })
    if (metadata.volume_tons)  items.push({ label: 'Volume', value: `${metadata.volume_tons} t` })
    if (metadata.brix_degree)  items.push({ label: 'Grau Brix', value: `${metadata.brix_degree} °Bx` })
  }

  return items
}

export default async function LotDetailPage({ params }: { params: { id: string } }) {
  const lot = await getLotById(params.id)
  if (!lot) notFound()

  const crop = CROP_LABELS[lot.crop_type] ?? { label: lot.crop_type, emoji: '🌿' }
  const status = STATUS_LABELS[lot.status] ?? { label: lot.status, color: 'text-gray-400 bg-gray-400/10 border-gray-400/20' }
  const metaItems = renderMetadata(lot.crop_type, lot.metadata as Record<string, unknown>)

  const events = (lot.events ?? []).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/dashboard/lots" className="text-[#6b8f6b] hover:text-white transition-colors mt-1">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-3xl">{crop.emoji}</span>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-white">
                  Lote — {crop.label}
                  {lot.harvest_year ? ` Safra ${lot.harvest_year}` : ''}
                </h2>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-[#6b8f6b] text-sm mt-0.5">
                Criado em {format(new Date(lot.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          </div>
        </div>

        <Link
          href={`/dashboard/reports/${lot.id}`}
          className="shrink-0 flex items-center gap-2 bg-[#1e2e1e] hover:bg-[#2d3d2d] text-[#4caf50] text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-[#2d3d2d]"
        >
          Ver Relatório EUDR
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Coluna esquerda — Detalhes */}
        <div className="lg:col-span-1 space-y-4">
          {/* Localização */}
          <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-3">Localização</h3>
            <div className="space-y-2.5">
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Propriedade"
                value={(lot as any).property?.name ?? '—'} />
              {lot.area_id && (
                <InfoRow icon={<Layers className="w-4 h-4" />} label="Área"
                  value={(lot as any).area?.name ?? '—'} />
              )}
              {lot.harvest_year && (
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Safra"
                  value={String(lot.harvest_year)} />
              )}
            </div>
          </div>

          {/* Dados da cultura */}
          {metaItems.length > 0 && (
            <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
              <h3 className="text-white font-semibold text-sm mb-3">
                Dados da Cultura
              </h3>
              <div className="space-y-2">
                {metaItems.map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-[#6b8f6b] text-xs">{item.label}</span>
                    <span className="text-white text-xs font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Coluna direita — Timeline */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold text-sm">
                Rastreabilidade — {events.length} evento{events.length !== 1 ? 's' : ''}
              </h3>
            </div>
            <EventTimeline events={events} />
          </div>

          {/* Adicionar evento */}
          <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
            <h3 className="text-white font-semibold text-sm mb-4">Registrar Evento</h3>
            <AddEventForm lotId={lot.id} />
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[#4d7a4d]">{icon}</span>
      <span className="text-[#6b8f6b] text-sm">{label}:</span>
      <span className="text-white text-sm font-medium truncate">{value}</span>
    </div>
  )
}
