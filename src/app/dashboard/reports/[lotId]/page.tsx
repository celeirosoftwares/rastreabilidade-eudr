// src/app/dashboard/reports/[lotId]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, Printer } from 'lucide-react'
import { getLotById } from '@/lib/actions/lots'
import { getAreaById } from '@/lib/actions/areas'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import dynamic from 'next/dynamic'

const AreaMap = dynamic(() => import('@/components/map/AreaMap'), { ssr: false })

const CROP_LABELS: Record<string, string> = {
  coffee: 'Café',
  soy: 'Soja',
  sugarcane: 'Cana-de-açúcar',
  corn: 'Milho',
  cotton: 'Algodão',
  other: 'Outro',
}

const EVENT_LABELS: Record<string, string> = {
  planting: 'Plantio',
  harvest: 'Colheita',
  transport: 'Transporte',
  processing: 'Processamento',
  sale: 'Venda',
  certification: 'Certificação',
  inspection: 'Inspeção',
}

function ComplianceCheck({
  label,
  ok,
  warning,
}: {
  label: string
  ok: boolean
  warning?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5">
      {ok ? (
        <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
      ) : warning ? (
        <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
      ) : (
        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
      )}
      <span className={`text-sm ${ok ? 'text-[#a0b8a0]' : warning ? 'text-yellow-400' : 'text-red-400'}`}>
        {label}
      </span>
    </div>
  )
}

export default async function ReportPage({ params }: { params: { lotId: string } }) {
  const lot = await getLotById(params.lotId)
  if (!lot) notFound()

  const property = (lot as any).property
  const area = lot.area_id ? await getAreaById(lot.area_id) : null
  const events = ((lot.events ?? []) as any[]).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Checklist de conformidade EUDR
  const checks = {
    hasProperty:  !!property,
    hasGeoArea:   !!area?.geojson,
    hasCarNumber: !!property?.car_number,
    hasPlanting:  events.some((e) => e.type === 'planting'),
    hasHarvest:   events.some((e) => e.type === 'harvest'),
    hasDocument:  !!property?.document_id,
  }

  const passedCount = Object.values(checks).filter(Boolean).length
  const totalChecks = Object.keys(checks).length
  const compliancePercent = Math.round((passedCount / totalChecks) * 100)

  const complianceColor =
    compliancePercent === 100
      ? 'text-green-400'
      : compliancePercent >= 60
      ? 'text-yellow-400'
      : 'text-red-400'

  const generatedAt = format(new Date(), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })

  return (
    <div className="max-w-4xl space-y-6 print:space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/lots/${lot.id}`} className="text-[#6b8f6b] hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white">Relatório de Conformidade EUDR</h2>
            <p className="text-[#6b8f6b] text-sm">Gerado em {generatedAt}</p>
          </div>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-[#1e2e1e] hover:bg-[#2d3d2d] border border-[#2d3d2d] text-[#6b8f6b] hover:text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
      </div>

      {/* Cabeçalho do relatório */}
      <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="text-xs text-[#4d7a4d] font-medium uppercase tracking-wider mb-1">
              Regulamento UE 2023/1115 — Relatório de Rastreabilidade
            </div>
            <h3 className="text-white text-lg font-bold">
              {CROP_LABELS[lot.crop_type] ?? lot.crop_type}
              {lot.harvest_year ? ` — Safra ${lot.harvest_year}` : ''}
            </h3>
            <p className="text-[#6b8f6b] text-sm mt-1">{property?.name ?? '—'}</p>
          </div>

          <div className="text-right">
            <div className={`text-4xl font-bold ${complianceColor}`}>{compliancePercent}%</div>
            <div className="text-[#4d7a4d] text-sm">conformidade</div>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-4 h-1.5 bg-[#1e2e1e] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              compliancePercent === 100
                ? 'bg-green-400'
                : compliancePercent >= 60
                ? 'bg-yellow-400'
                : 'bg-red-400'
            }`}
            style={{ width: `${compliancePercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Checklist */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
            <h4 className="text-white font-semibold text-sm mb-4">Checklist EUDR</h4>
            <div className="space-y-3">
              <ComplianceCheck label="Propriedade cadastrada" ok={checks.hasProperty} />
              <ComplianceCheck label="CPF/CNPJ do produtor" ok={checks.hasDocument} />
              <ComplianceCheck label="Número do CAR" ok={checks.hasCarNumber} warning={!checks.hasCarNumber} />
              <ComplianceCheck label="Área georreferenciada" ok={checks.hasGeoArea} />
              <ComplianceCheck label="Evento de plantio registrado" ok={checks.hasPlanting} />
              <ComplianceCheck label="Evento de colheita registrado" ok={checks.hasHarvest} warning={!checks.hasHarvest} />
            </div>
          </div>

          {/* Dados do produtor */}
          <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
            <h4 className="text-white font-semibold text-sm mb-3">Dados do Produtor</h4>
            <dl className="space-y-2">
              {[
                { label: 'Produtor', value: property?.owner_name },
                { label: 'Documento', value: property?.document_id },
                { label: 'Propriedade', value: property?.name },
                { label: 'CAR', value: property?.car_number ?? 'Não informado' },
                { label: 'Município', value: property?.municipality ? `${property.municipality}/${property.state}` : property?.state },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-[#6b8f6b] text-xs shrink-0">{label}</dt>
                  <dd className="text-white text-xs text-right font-medium">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Dados do lote */}
          <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
            <h4 className="text-white font-semibold text-sm mb-3">Dados do Lote</h4>
            <dl className="space-y-2">
              {[
                { label: 'Cultura', value: CROP_LABELS[lot.crop_type] },
                { label: 'Safra', value: lot.harvest_year ? String(lot.harvest_year) : '—' },
                { label: 'Status', value: lot.status },
                { label: 'Área', value: area ? `${area.name} (${area.size_hectares ? Number(area.size_hectares).toFixed(2) + ' ha' : '—'})` : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-[#6b8f6b] text-xs shrink-0">{label}</dt>
                  <dd className="text-white text-xs text-right font-medium">{value ?? '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* Coluna direita */}
        <div className="lg:col-span-2 space-y-5">
          {/* Mapa */}
          {area?.geojson && (
            <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
              <h4 className="text-white font-semibold text-sm mb-3">
                Geolocalização da Área — {area.name}
              </h4>
              <AreaMap initialGeojson={area.geojson as any} onPolygonChange={() => {}} readonly />
              {area.size_hectares && (
                <p className="text-[#6b8f6b] text-xs mt-2">
                  Área total: <span className="text-white font-medium">{Number(area.size_hectares).toFixed(4)} hectares</span>
                </p>
              )}
            </div>
          )}

          {/* Timeline de eventos */}
          <div className="bg-[#172117] border border-[#2d3d2d] rounded-2xl p-5">
            <h4 className="text-white font-semibold text-sm mb-4">
              Cadeia de Custódia — {events.length} evento{events.length !== 1 ? 's' : ''}
            </h4>

            {events.length === 0 ? (
              <p className="text-[#4d7a4d] text-sm">Nenhum evento registrado para este lote.</p>
            ) : (
              <div className="relative">
                <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#2d3d2d]" />
                <div className="space-y-4">
                  {events.map((event) => (
                    <div key={event.id} className="relative flex gap-4 pl-6">
                      <div className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-[#4caf50] border-2 border-[#172117] shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white text-sm font-semibold">
                            {EVENT_LABELS[event.type] ?? event.type}
                          </span>
                          <span className="text-[#4d7a4d] text-xs">
                            {format(new Date(event.date), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-[#a0b8a0] text-sm mt-0.5">{event.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Aviso de conformidade */}
          <div className="bg-[#0f1a0f] border border-[#2d3d2d] rounded-2xl p-4 text-xs text-[#4d7a4d] leading-relaxed">
            <strong className="text-[#6b8f6b]">Aviso Legal:</strong> Este relatório foi gerado automaticamente pela plataforma RastreiO com base nos dados fornecidos pelo produtor. 
            Para fins de exportação à União Europeia nos termos do Regulamento (UE) 2023/1115, o produtor é responsável pela veracidade das informações e pela comprovação de ausência de desmatamento na área declarada, conforme o Artigo 3 do referido regulamento.
            Gerado em {generatedAt}.
          </div>
        </div>
      </div>
    </div>
  )
}
