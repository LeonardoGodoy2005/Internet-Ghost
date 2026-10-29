
import { Fantasma } from '../tipos/fantasma'

const ENDERECO_CDX = 'https://web.archive.org/cdx/search/cdx'

const TEMPO_LIMITE_MS = 15000
const TEMPO_CACHE_MS = 5 * 60 * 1000
const LIMITE_CAPTURAS = 1000
const INTERVALO_CONSULTAS_MS = 1000
const TAMANHO_PERIODO_ANOS = 7
const LIMITE_CAPTURAS_POR_PERIODO = 1000

interface OpcoesConsulta {
  limite?: string
  capturasRecentes?: boolean
  anoInicial?: number
  anoFinal?: number
}

interface HistoricoEmCache {
  expiraEm: number
  dados: Fantasma
}

const cacheHistorico = new Map<string, HistoricoEmCache>()

function aguardar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

function normalizarDominio(dominio: string): string {
  return dominio
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .split('/')[0]
    .replace(/:\d+$/, '')
}

function validarDominio(dominio: string): boolean {
  return (
    dominio.length <= 253 &&
    /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(
      dominio
    )
  )
}

async function consultarCapturas(
  dominio: string,
  opcoes: OpcoesConsulta = {}
): Promise<string[]> {
  const url = new URL(ENDERECO_CDX)

  url.searchParams.set('url', dominio)
  url.searchParams.set('output', 'json')
  url.searchParams.set('fl', 'timestamp,statuscode')
  url.searchParams.set('filter', 'statuscode:200')
  url.searchParams.set('showResume', 'false')

  if (opcoes.anoInicial !== undefined) {
    url.searchParams.set('from', String(opcoes.anoInicial))
  }

  if (opcoes.anoFinal !== undefined) {
    url.searchParams.set('to', String(opcoes.anoFinal))
  }

  if (
    opcoes.anoInicial !== undefined ||
    opcoes.anoFinal !== undefined
  ) {
    // Agrupa por mês, permitindo várias capturas por ano.
    url.searchParams.set('collapse', 'timestamp:6')
    url.searchParams.set(
      'limit',
      String(LIMITE_CAPTURAS_POR_PERIODO)
    )
  } else {
    url.searchParams.set('collapse', 'digest')

    if (opcoes.limite) {
      url.searchParams.set('limit', opcoes.limite)
    }
  }

  if (opcoes.capturasRecentes) {
    url.searchParams.set('fastLatest', 'true')
  }

  let resposta: Response

  try {
    resposta = await fetch(url, {
      signal: AbortSignal.timeout(TEMPO_LIMITE_MS),
      headers: {
        'User-Agent': 'InternetGhosts/1.0'
      }
    })
  } catch (erro) {
    if (erro instanceof Error && erro.name === 'TimeoutError') {
      throw new Error('A consulta à Wayback Machine expirou.')
    }

    if (erro instanceof Error && erro.name === 'AbortError') {
      throw new Error('A consulta à Wayback Machine foi interrompida.')
    }

    throw new Error('Não foi possível conectar à Wayback Machine.')
  }

  if (resposta.status === 429) {
    throw new Error('A Wayback Machine está limitando as consultas.')
  }

  if (!resposta.ok) {
    throw new Error(
      `Falha ao consultar o arquivo histórico (${resposta.status}).`
    )
  }

  const dados: unknown = await resposta.json()

  if (!Array.isArray(dados)) {
    throw new Error('A resposta do arquivo histórico é inválida.')
  }

  return dados
    .slice(1)
    .filter(
      (registro): registro is string[] =>
        Array.isArray(registro) &&
        typeof registro[0] === 'string' &&
        /^\d{14}$/.test(registro[0]) &&
        registro[1] === '200'
    )
    .map((registro) => registro[0])
}

export async function buscarHistorico(
  dominioInformado: string
): Promise<Fantasma> {
  const dominio = normalizarDominio(dominioInformado)

  if (!validarDominio(dominio)) {
    throw new Error('Digite um domínio válido, como google.com.')
  }

  const agora = Date.now()
  const resultadoEmCache = cacheHistorico.get(dominio)

  if (resultadoEmCache && resultadoEmCache.expiraEm > agora) {
    return resultadoEmCache.dados
  }

  // Descobre a primeira captura registrada.
  const capturasAntigas = await consultarCapturas(dominio, {
    limite: '1'
  })

  await aguardar(INTERVALO_CONSULTAS_MS)

  // Busca as capturas mais recentes.
  const capturasRecentes = await consultarCapturas(dominio, {
    limite: `-${LIMITE_CAPTURAS}`,
    capturasRecentes: true
  })

  if (capturasAntigas.length === 0 && capturasRecentes.length === 0) {
    throw new Error(
      'Nenhuma captura válida foi encontrada para esse domínio.'
    )
  }

  const primeiraCaptura =
    [...capturasAntigas].sort()[0] ??
    [...capturasRecentes].sort()[0]

  if (!primeiraCaptura) {
    throw new Error('Não foi possível identificar a primeira captura.')
  }

  const anoInicial = Number(primeiraCaptura.substring(0, 4))
  const anoAtual = new Date().getFullYear()
  const capturasHistoricas: string[] = []
  const errosPeriodos: string[] = []

  // Busca o histórico em blocos de até sete anos.
  // O agrupamento mensal permite múltiplas capturas por ano.
  for (
    let inicio = anoInicial;
    inicio <= anoAtual;
    inicio += TAMANHO_PERIODO_ANOS
  ) {
    const fim = Math.min(
      inicio + TAMANHO_PERIODO_ANOS - 1,
      anoAtual
    )

    try {
      await aguardar(INTERVALO_CONSULTAS_MS)

      const capturasPeriodo = await consultarCapturas(dominio, {
        anoInicial: inicio,
        anoFinal: fim
      })

      capturasHistoricas.push(...capturasPeriodo)
    } catch (erro) {
      errosPeriodos.push(`${inicio}-${fim}`)

      // Continua tentando os próximos períodos.
      continue
    }
  }

  const todasCapturas = [
    ...new Set([
      ...capturasAntigas,
      ...capturasRecentes,
      ...capturasHistoricas
    ])
  ].sort()

  const primeiraData = todasCapturas[0] ?? primeiraCaptura

  const ultimaData =
  [...capturasRecentes].sort().pop() ??
  [...todasCapturas].sort().pop() ??
  null

  if (!ultimaData) {
    throw new Error('Não foi possível identificar a última captura.')
  }

  const anosAtivos = [
    ...new Set(
      todasCapturas.map((data) => Number(data.substring(0, 4)))
    )
  ].sort((a, b) => a - b)

  const nivelAbandono = calcularNivelAbandono(ultimaData)

  const resultado: Fantasma = {
    dominio,
    primeiraCaptura: primeiraData,
    ultimaCaptura: ultimaData,
    totalCapturas: todasCapturas.length,
    anosAtivos,
    capturas: todasCapturas,
    nivelAbandono,
    estado: definirEstado(nivelAbandono)
  }

  cacheHistorico.set(dominio, {
    expiraEm: Date.now() + TEMPO_CACHE_MS,
    dados: resultado
  })

  return resultado
}

function calcularNivelAbandono(ultimaCaptura: string | null): number {
  if (!ultimaCaptura) return 100

  const anoUltimaCaptura = Number(ultimaCaptura.substring(0, 4))
  const anoAtual = new Date().getFullYear()
  const anosSemCaptura = anoAtual - anoUltimaCaptura

  return Math.min(100, Math.max(0, anosSemCaptura * 10))
}

function definirEstado(nivelAbandono: number): Fantasma['estado'] {
  if (nivelAbandono <= 20) return 'VIVO'
  if (nivelAbandono <= 50) return 'ADORMECIDO'
  if (nivelAbandono <= 80) return 'ABANDONADO'

  return 'FANTASMA'
}
