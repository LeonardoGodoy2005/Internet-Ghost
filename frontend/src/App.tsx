
import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import './App.css'

type EstadoFantasma = 'VIVO' | 'ADORMECIDO' | 'ABANDONADO' | 'FANTASMA'

interface Fantasma {
  dominio: string
  estado: EstadoFantasma
  totalCapturas: number
  nivelAbandono: number
  primeiraCaptura: string
  ultimaCaptura: string
  capturas: string[]
}

interface RespostaApi {
  dominio?: string
  estado?: EstadoFantasma
  totalCapturas?: number
  nivelAbandono?: number
  primeiraCaptura?: string
  ultimaCaptura?: string
  capturas?: unknown[]
  historico?: unknown[]
  [chave: string]: unknown
}

const URL_API =
  import.meta.env.VITE_API_URL || 'http://localhost:3333/api/fantasmas'

function carimbo(valor: string): string {
  const numeros = valor.replace(/\D/g, '')
  return numeros.length >= 8 ? numeros.slice(0, 14).padEnd(14, '0') : valor
}

function formatarData(valor?: string): string {
  if (!valor) return 'Não disponível'

  const data = carimbo(valor)

  if (/^\d{14}$/.test(data)) {
    return `${data.slice(6, 8)}/${data.slice(4, 6)}/${data.slice(0, 4)}`
  }

  const dataConvertida = new Date(valor)

  return Number.isNaN(dataConvertida.getTime())
    ? valor
    : dataConvertida.toLocaleDateString('pt-BR')
}

function formatarDataHora(valor: string): string {
  const data = carimbo(valor)

  if (/^\d{14}$/.test(data)) {
    return `${data.slice(6, 8)}/${data.slice(4, 6)}/${data.slice(0, 4)} às ${data.slice(8, 10)}:${data.slice(10, 12)}:${data.slice(12, 14)}`
  }

  return formatarData(valor)
}

function anoDaCaptura(valor: string): number {
  return Number(carimbo(valor).slice(0, 4))
}

function normalizarResposta(dados: RespostaApi, dominio: string): Fantasma {
  const lista = Array.isArray(dados.capturas)
    ? dados.capturas
    : Array.isArray(dados.historico)
      ? dados.historico
      : []

  const capturas = [
    ...new Set(
      lista
        .map((item) => {
          if (typeof item === 'string') return carimbo(item)

          if (Array.isArray(item) && typeof item[0] === 'string') {
            return carimbo(item[0])
          }

          if (item && typeof item === 'object') {
            const registro = item as Record<string, unknown>
            const data =
              registro.timestamp ?? registro.data ?? registro.carimbo

            if (typeof data === 'string' || typeof data === 'number') {
              return carimbo(String(data))
            }
          }

          return ''
        })
        .filter((item) => /^\d{14}$/.test(item)),
    ),
  ].sort((a, b) => b.localeCompare(a))

  const primeiraCaptura =
    typeof dados.primeiraCaptura === 'string'
      ? dados.primeiraCaptura
      : capturas.at(-1) ?? ''

  const ultimaCaptura =
    typeof dados.ultimaCaptura === 'string'
      ? dados.ultimaCaptura
      : capturas[0] ?? ''

  const estadoRecebido = dados.estado
  const anoUltima = anoDaCaptura(ultimaCaptura)
  const idade = anoUltima ? new Date().getFullYear() - anoUltima : 0

  const estado: EstadoFantasma =
    estadoRecebido &&
    ['VIVO', 'ADORMECIDO', 'ABANDONADO', 'FANTASMA'].includes(estadoRecebido)
      ? estadoRecebido
      : idade >= 10
        ? 'ABANDONADO'
        : idade >= 5
          ? 'ADORMECIDO'
          : ultimaCaptura
            ? 'VIVO'
            : 'FANTASMA'

  return {
    dominio: typeof dados.dominio === 'string' ? dados.dominio : dominio,
    estado,
    totalCapturas:
      typeof dados.totalCapturas === 'number'
        ? dados.totalCapturas
        : capturas.length,
    nivelAbandono:
      typeof dados.nivelAbandono === 'number'
        ? Math.max(0, Math.min(100, dados.nivelAbandono))
        : 0,
    primeiraCaptura,
    ultimaCaptura,
    capturas,
  }
}

/* Ícone reutilizável do Internet Fantasma */
function IconeFantasma({ tamanho = 32 }: { tamanho?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={tamanho}
      height={tamanho}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M8 40V21C8 11.6 14.7 5 24 5S40 11.6 40 21V40L32 35L24 40L16 35L8 40Z"
        fill="#65F7FF"
        fillOpacity=".18"
        stroke="#65F7FF"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M17 21L21 23M31 21L27 23"
        stroke="#65F7FF"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M20 30L24 27L28 30"
        stroke="#65F7FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

/* Miniaturas da seção de capturas recentes */
function Miniatura({ indice }: { indice: number }) {
  return (
    <div className={`miniatura miniatura-${indice % 4}`} aria-hidden="true">
      <div className="miniatura-cabecalho">
        <span />
        <span />
        <span />
      </div>

      <div className="miniatura-pagina">
        <div className="miniatura-logo">
          G<span>o</span>ogle
        </div>
        <div className="miniatura-busca" />
        <div className="miniatura-linha" />
        <div className="miniatura-linha curta" />
      </div>
    </div>
  )
}

/* Arte holográfica do Internet Fantasma */
function ArteHolografica({
  carregando,
  comMemoria,
}: {
  carregando: boolean
  comMemoria: boolean
}) {
  return (
    <div
      className={`arte-hero fantasma-visual ${
        carregando ? 'em-investigacao' : ''
      } ${comMemoria ? 'com-memoria' : ''}`}
      aria-hidden="true"
    >
      <div className="cenario-grade" />
      <div className="cenario-nevoa" />

      <div className="fantasma-orbita orbita-um" />
      <div className="fantasma-orbita orbita-dois" />
      <div className="fantasma-orbita orbita-tres" />

      <div className="particulas-digitais">
        {Array.from({ length: 12 }, (_, indice) => (
          <i key={indice} />
        ))}
      </div>

      <div className="janela-arquivo janela-esquerda">
        <div className="janela-cabecalho">
          <span />
          <span />
          <span />
          <small>archive_1998.html</small>
        </div>

        <div className="janela-conteudo">
          <div className="arquivo-logo">N</div>
          <div className="arquivo-linha linha-larga" />
          <div className="arquivo-linha" />

          <div className="arquivo-bloco">
            <span />
            <span />
            <span />
          </div>

          <div className="arquivo-linha linha-curta" />
        </div>

        <span className="janela-ano">1998</span>
      </div>

      <div className="janela-arquivo janela-direita">
        <div className="janela-cabecalho">
          <span />
          <span />
          <span />
          <small>memory_trace.dat</small>
        </div>

        <div className="codigo-antigo">
          <span>01&nbsp; &lt;html&gt;</span>
          <span>02&nbsp; &lt;body&gt;</span>
          <span>03&nbsp; &nbsp;memories()</span>
          <span>04&nbsp; &lt;/body&gt;</span>
          <span>05&nbsp; &lt;/html&gt;</span>
        </div>

        <span className="janela-ano">DATA RECOVERED</span>
      </div>

      <div className="janela-arquivo janela-inferior">
        <div className="janela-cabecalho">
          <span />
          <span />
          <span />
          <small>lost_page.web</small>
        </div>

        <div className="pagina-perdida">
          <div className="pagina-imagem" />

          <div>
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>

      <div className="fantasma-holograma">
        <div className="halo-fantasma" />

        <svg
          className="fantasma-svg"
          viewBox="0 0 280 330"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient
              id="fantasmaCorpo"
              x1="55"
              y1="35"
              x2="220"
              y2="300"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#E8FFFF" stopOpacity=".95" />
              <stop offset=".36" stopColor="#65F7FF" stopOpacity=".62" />
              <stop offset="1" stopColor="#00D9C5" stopOpacity=".06" />
            </linearGradient>

            <linearGradient
              id="fantasmaContorno"
              x1="45"
              y1="30"
              x2="235"
              y2="300"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#F0FFFF" />
              <stop offset=".45" stopColor="#53F6FF" />
              <stop offset="1" stopColor="#00FFB3" />
            </linearGradient>

            <filter
              id="fantasmaBrilho"
              x="-80%"
              y="-80%"
              width="260%"
              height="260%"
            >
              <feGaussianBlur stdDeviation="5" result="desfoque" />
              <feMerge>
                <feMergeNode in="desfoque" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M140 29C92 29 60 67 60 117V236L84 220L106 244L129 227L151 246L175 224L197 239L220 220V117C220 67 188 29 140 29Z"
            fill="url(#fantasmaCorpo)"
            fillOpacity=".34"
          />

          <path
            d="M140 29C92 29 60 67 60 117V236L84 220L106 244L129 227L151 246L175 224L197 239L220 220V117C220 67 188 29 140 29Z"
            stroke="url(#fantasmaContorno)"
            strokeWidth="2.5"
            filter="url(#fantasmaBrilho)"
          />

          <path
            d="M76 106C82 65 106 45 140 45C174 45 198 65 204 106"
            stroke="#E9FFFF"
            strokeOpacity=".7"
            strokeWidth="1.5"
          />

          <path
            d="M83 142L83 197M197 142L197 194"
            stroke="#6CFBFF"
            strokeOpacity=".65"
          />

          <ellipse
            cx="105"
            cy="135"
            rx="12"
            ry="19"
            fill="#DFFFFF"
            filter="url(#fantasmaBrilho)"
          />

          <ellipse
            cx="175"
            cy="135"
            rx="12"
            ry="19"
            fill="#DFFFFF"
            filter="url(#fantasmaBrilho)"
          />

          <ellipse cx="105" cy="135" rx="5" ry="11" fill="#00F5E0" />
          <ellipse cx="175" cy="135" rx="5" ry="11" fill="#00F5E0" />

          <path
            d="M125 172Q140 184 155 172"
            stroke="#C9FFFF"
            strokeWidth="2"
            strokeLinecap="round"
          />

          <path
            d="M69 205H211M75 213H205M86 221H194"
            stroke="#4CFFF3"
            strokeOpacity=".42"
          />

          <path
            d="M99 58H181M91 66H189M84 74H196"
            stroke="#CFFFFF"
            strokeOpacity=".18"
          />

          <path
            d="M62 91H91M189 91H218M60 184H77M203 184H220"
            stroke="#8FFFFF"
            strokeOpacity=".7"
          />

          <path
            d="M91 250L102 265M140 249V274M189 247L178 266"
            stroke="#42FFE4"
            strokeOpacity=".65"
          />

          <circle cx="61" cy="160" r="3" fill="#8FFFFF" />
          <circle cx="219" cy="168" r="2" fill="#00FFB3" />
          <circle cx="111" cy="278" r="2" fill="#8FFFFF" />
          <circle cx="169" cy="283" r="3" fill="#00FFB3" />
        </svg>

        <div className="holograma-base" />
        <div className="holograma-varredura" />
      </div>

      <div className="fantasma-coordenada coord-um">MEMORY_SCAN_01</div>
      <div className="fantasma-coordenada coord-dois">DATA // TRACE</div>
      <div className="fantasma-coordenada coord-tres">1998 — PRESENT</div>

      <div className="leitura-sinal">
        <span className="sinal-ponto" />
        {carregando
          ? 'INVESTIGATING...'
          : comMemoria
            ? 'MEMORY RECOVERED'
            : 'SIGNAL DETECTED'}
      </div>

      <div className="leitura-coordenadas">LAT 37.7749 / WEB 001</div>
    </div>
  )
}

export default function App() {
  const [dominio, setDominio] = useState('google.com')
  const [fantasma, setFantasma] = useState<Fantasma | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [anoSelecionado, setAnoSelecionado] = useState<number | null>(null)
  const [limiteCapturas, setLimiteCapturas] = useState(7)
  const [filtroTempo, setFiltroTempo] = useState('todos')
  const [menuAtivo, setMenuAtivo] = useState('inicio')

  const [capturaAntiga, setCapturaAntiga] = useState('')
  const [capturaNova, setCapturaNova] = useState('')
  const [mostrarComparacao, setMostrarComparacao] = useState(false)

  const capturas = fantasma?.capturas ?? []

  const anos = useMemo(
    () =>
      [...new Set(capturas.map(anoDaCaptura))]
        .filter(Boolean)
        .sort((a, b) => a - b),
    [capturas],
  )

  const atividadePorAno = useMemo(() => {
    const mapa = new Map<number, number>()

    capturas.forEach((captura) => {
      const ano = anoDaCaptura(captura)
      if (ano) mapa.set(ano, (mapa.get(ano) ?? 0) + 1)
    })

    return [...mapa.entries()]
      .map(([ano, quantidade]) => ({ ano, quantidade }))
      .sort((a, b) => b.ano - a.ano)
  }, [capturas])

  const maiorAtividade = Math.max(
    1,
    ...atividadePorAno.map((item) => item.quantidade),
  )

  const capturasFiltradas = useMemo(() => {
    let lista =
      anoSelecionado === null
        ? capturas
        : capturas.filter((item) => anoDaCaptura(item) === anoSelecionado)

    if (filtroTempo === '15') {
      lista = lista.filter(
        (item) => anoDaCaptura(item) >= new Date().getFullYear() - 14,
      )
    } else if (filtroTempo === '5') {
      lista = lista.filter(
        (item) => anoDaCaptura(item) >= new Date().getFullYear() - 4,
      )
    }

    return lista
  }, [capturas, anoSelecionado, filtroTempo])

  const capturasVisiveis = capturasFiltradas.slice(0, limiteCapturas)

  const capturasRecentes = [...capturas]
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 10)

  const nomesEstados: Record<EstadoFantasma, string> = {
    VIVO: 'Ativo',
    ADORMECIDO: 'Adormecido',
    ABANDONADO: 'Abandonado',
    FANTASMA: 'Fantasma',
  }

  function selecionarCaptura(captura: string) {
    setMostrarComparacao(false)

    if (capturaAntiga === captura) {
      setCapturaAntiga(capturaNova)
      setCapturaNova('')
      return
    }

    if (capturaNova === captura) {
      setCapturaNova('')
      return
    }

    if (!capturaAntiga) {
      setCapturaAntiga(captura)
      return
    }

    if (!capturaNova) {
      if (captura.localeCompare(capturaAntiga) < 0) {
        setCapturaNova(capturaAntiga)
        setCapturaAntiga(captura)
      } else {
        setCapturaNova(captura)
      }
      return
    }

    setCapturaAntiga(captura)
    setCapturaNova('')
  }

  function limparComparacao() {
    setCapturaAntiga('')
    setCapturaNova('')
    setMostrarComparacao(false)
  }

  function enderecoArquivo(captura: string): string {
    const dominioAtual = fantasma?.dominio ?? dominio

    return `https://web.archive.org/web/${captura}/${encodeURIComponent(dominioAtual)}`
  }

  async function pesquisarFantasma(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()

    const dominioLimpo = dominio
      .trim()
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .split('/')[0]
      .toLowerCase()

    if (!dominioLimpo) {
      setErro('Digite um domínio para iniciar a investigação.')
      return
    }

    setCarregando(true)
    setErro('')
    setFantasma(null)
    setAnoSelecionado(null)
    setLimiteCapturas(7)
    limparComparacao()

    try {
      const resposta = await fetch(
        `${URL_API}/${encodeURIComponent(dominioLimpo)}`,
      )

      if (!resposta.ok) {
        if (resposta.status === 404) {
          throw new Error('Não encontramos registros para esse domínio.')
        }

        if (resposta.status === 429) {
          throw new Error(
            'Muitas consultas em sequência. Aguarde um pouco e tente novamente.',
          )
        }

        throw new Error(
          `O servidor respondeu com o erro ${resposta.status}.`,
        )
      }

      const dados = (await resposta.json()) as RespostaApi

      setFantasma(normalizarResposta(dados, dominioLimpo))
      setDominio(dominioLimpo)
    } catch (falha) {
      setErro(
        falha instanceof TypeError
          ? 'Não foi possível conectar à API. Confira se o backend está rodando na porta 3333.'
          : falha instanceof Error
            ? falha.message
            : 'Não foi possível concluir a investigação.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <div className="painel-aplicacao">
      <aside className="menu-lateral">
        <a
          className="marca"
          href="#inicio"
          onClick={() => setMenuAtivo('inicio')}
          aria-label="Internet Fantasma — página inicial"
        >
          <span className="marca-fantasma">
            <IconeFantasma tamanho={32} />
          </span>

          <span className="marca-titulo">
            INTERNET<strong>FANTASMA</strong>
            <small>ARQUIVO HISTÓRICO</small>
          </span>
        </a>

        <nav className="menu-navegacao" aria-label="Navegação principal">
          <a
            className={menuAtivo === 'inicio' ? 'menu-link ativo' : 'menu-link'}
            href="#inicio"
            onClick={() => setMenuAtivo('inicio')}
          >
            <span>⌂</span> Início
          </a>

          <a
            className={
              menuAtivo === 'explorar' ? 'menu-link ativo' : 'menu-link'
            }
            href="#investigador"
            onClick={() => setMenuAtivo('explorar')}
          >
            <span>⌕</span> Explorar
          </a>

          <a
            className={menuAtivo === 'sobre' ? 'menu-link ativo' : 'menu-link'}
            href="#sobre"
            onClick={() => setMenuAtivo('sobre')}
          >
            <span>ⓘ</span> Sobre
          </a>
        </nav>

        <div className="menu-base">
          <div className="onda-decorativa" />

          <p>
            FANTASMAS DA INTERNET
            <br />
            EXPLORANDO O PASSADO DIGITAL
          </p>

          <span>
            FEITO PARA DESCOBRIR O QUE
            <br />
            A INTERNET GUARDOU.
          </span>
        </div>
      </aside>

      <main className="area-principal" id="inicio">
        <header className="barra-superior">
          <span className="caminho-pagina">
            ARQUIVO HISTÓRICO <b>/</b> INVESTIGAÇÃO
          </span>

          <div className="status-conexao">
            <span className="ponto-verde" /> Conectado
          </div>
        </header>

        <div className="grade-dashboard">
          <div className="coluna-central">
            <section className="hero-painel" id="investigador">
              <div className="hero-conteudo">
                <span className="sobrelinha">
                  <b>✳</b> ARQUEOLOGIA DIGITAL
                </span>

                <h1>
                  A internet esqueceu.
                  <br />
                  <em>Nós encontramos.</em>
                </h1>

                <p>
                  Todo domínio deixa rastros. Investigue o passado de sites,
                  <br className="desktop-only" />
                  descubra suas memórias arquivadas e encontre os fantasmas
                  <br className="desktop-only" />
                  que ainda habitam na internet.
                </p>

                <form className="campo-pesquisa" onSubmit={pesquisarFantasma}>
                  <span className="icone-lupa">⌕</span>

                  <input
                    value={dominio}
                    onChange={(evento) => setDominio(evento.target.value)}
                    placeholder="Digite um domínio, ex.: google.com"
                    aria-label="Domínio para investigar"
                  />

                  <button
                    type="submit"
                    aria-label="Investigar domínio"
                    disabled={carregando}
                  >
                    {carregando ? '…' : '›'}
                  </button>
                </form>

                <div className="nota-wayback">
                  ↳ dados históricos fornecidos pela{' '}
                  <a
                    href="https://web.archive.org/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Wayback Machine ↗
                  </a>
                </div>
              </div>

              <ArteHolografica
                carregando={carregando}
                comMemoria={Boolean(fantasma)}
              />
            </section>

            {erro && (
              <div className="alerta-erro" role="alert">
                {erro}
              </div>
            )}

            {carregando && (
              <div className="alerta-carregando" role="status">
                <span className="spinner" />
                Vasculhando os arquivos do passado...
              </div>
            )}

            {fantasma && (
              <section className="resumo-dominio">
                <div className="dominio-identidade">
                  <span className="icone-globo">◎</span>

                  <div>
                    <small>DOMÍNIO INVESTIGADO</small>
                    <strong>{fantasma.dominio}</strong>
                  </div>

                  <span
                    className={`selo-estado estado-${fantasma.estado.toLowerCase()}`}
                  >
                    {nomesEstados[fantasma.estado]}
                  </span>
                </div>

                <div className="resumo-metrica">
                  <small>CAPTURAS ENCONTRADAS</small>
                  <strong>
                    {fantasma.totalCapturas.toLocaleString('pt-BR')}
                  </strong>
                  <span>
                    Registros contabilizados
                    <br />
                    pelo serviço
                  </span>
                </div>

                <div className="resumo-metrica">
                  <small>NÍVEL DE ABANDONO</small>
                  <strong>{fantasma.nivelAbandono}%</strong>
                  <span>
                    Estimativa baseada na
                    <br />
                    última captura
                  </span>
                </div>

                <div className="resumo-metrica">
                  <small>PRIMEIRA CAPTURA</small>
                  <strong className="valor-data">
                    {formatarData(fantasma.primeiraCaptura)}
                  </strong>
                  <span>
                    Primeira captura
                    <br />
                    retornada
                  </span>
                </div>

                <div className="resumo-metrica">
                  <small>ÚLTIMA CAPTURA</small>
                  <strong className="valor-data">
                    {formatarData(fantasma.ultimaCaptura)}
                  </strong>
                  <span>
                    Última captura
                    <br />
                    retornada
                  </span>
                </div>
              </section>
            )}

            {!fantasma && !carregando && !erro && (
              <section className="resumo-dominio resumo-inicial">
                <div className="dominio-identidade">
                  <span className="icone-globo">◎</span>

                  <div>
                    <small>PRONTO PARA INVESTIGAR</small>
                    <strong>Escolha um domínio</strong>
                  </div>
                </div>

                <div className="resumo-metrica">
                  <small>CAPTURAS ENCONTRADAS</small>
                  <strong>—</strong>
                  <span>Registros do arquivo</span>
                </div>

                <div className="resumo-metrica">
                  <small>NÍVEL DE ABANDONO</small>
                  <strong>—</strong>
                  <span>Estimativa histórica</span>
                </div>

                <div className="resumo-metrica">
                  <small>PRIMEIRA CAPTURA</small>
                  <strong className="valor-data">—</strong>
                  <span>Primeiro registro</span>
                </div>

                <div className="resumo-metrica">
                  <small>ÚLTIMA CAPTURA</small>
                  <strong className="valor-data">—</strong>
                  <span>Registro mais recente</span>
                </div>
              </section>
            )}

            <div className="grade-paineis">
              <section className="painel linha-do-tempo" id="linha-do-tempo">
                <div className="titulo-painel">
                  <div>
                    <span className="numero-secao">01</span>

                    <div>
                      <h2>LINHA DO TEMPO</h2>
                      <p>
                        Uma história em fragmentos.
                        <br />
                        Selecione um ano para explorar suas memórias.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="filtros-tempo">
                  <button
                    className={filtroTempo === 'todos' ? 'filtro ativo' : 'filtro'}
                    onClick={() => {
                      setFiltroTempo('todos')
                      setAnoSelecionado(null)
                    }}
                    type="button"
                  >
                    Todos
                  </button>

                  <button
                    className={filtroTempo === '15' ? 'filtro ativo' : 'filtro'}
                    onClick={() => {
                      setFiltroTempo('15')
                      setAnoSelecionado(null)
                    }}
                    type="button"
                  >
                    Últimos 15 anos
                  </button>

                  <button
                    className={filtroTempo === '5' ? 'filtro ativo' : 'filtro'}
                    onClick={() => {
                      setFiltroTempo('5')
                      setAnoSelecionado(null)
                    }}
                    type="button"
                  >
                    Últimos 5 anos
                  </button>

                  <select
                    aria-label="Filtrar por ano"
                    value={anoSelecionado ?? ''}
                    onChange={(evento) =>
                      setAnoSelecionado(
                        evento.target.value ? Number(evento.target.value) : null,
                      )
                    }
                  >
                    <option value="">Todos os anos</option>

                    {anos.map((ano) => (
                      <option key={ano} value={ano}>
                        {ano}
                      </option>
                    ))}
                  </select>
                </div>

                {atividadePorAno.length > 0 ? (
                  <div className="grafico-tempo">
                    <div className="grafico-grade">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>

                    <div className="colunas-tempo">
                      {[...atividadePorAno]
                        .sort((a, b) => a.ano - b.ano)
                        .map((item) => (
                          <button
                            key={item.ano}
                            type="button"
                            className={`coluna-tempo ${
                              anoSelecionado === item.ano ? 'escolhida' : ''
                            }`}
                            onClick={() => setAnoSelecionado(item.ano)}
                            title={`${item.quantidade} capturas em ${item.ano}`}
                          >
                            <span
                              className="coluna-barra"
                              style={{
                                height: `${Math.max(
                                  3,
                                  (item.quantidade / maiorAtividade) * 88,
                                )}%`,
                              }}
                            />

                            <span className="coluna-ano">{item.ano}</span>
                            <span className="coluna-total">{item.quantidade}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="grafico-vazio">
                    Sua linha do tempo aparecerá aqui após a investigação.
                  </div>
                )}
              </section>

              <section className="painel atividade-historica" id="atividade">
                <div className="titulo-painel">
                  <div>
                    <span className="numero-secao">02</span>

                    <div>
                      <h2>ATIVIDADE HISTÓRICA</h2>
                      <p>
                        Os anos mais movimentados.
                        <br />
                        Quantidade de capturas reunidas em cada ano.
                      </p>
                    </div>
                  </div>
                </div>

                {atividadePorAno.length > 0 ? (
                  <div className="lista-atividade">
                    {atividadePorAno.map((item) => (
                      <button
                        type="button"
                        key={item.ano}
                        className={`item-atividade ${
                          anoSelecionado === item.ano ? 'escolhido' : ''
                        }`}
                        onClick={() => setAnoSelecionado(item.ano)}
                      >
                        <span>{item.ano}</span>

                        <span className="trilho-atividade">
                          <i
                            style={{
                              width: `${
                                (item.quantidade / maiorAtividade) * 100
                              }%`,
                            }}
                          />
                        </span>

                        <b>{item.quantidade}</b>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="atividade-vazia">
                    Sem dados históricos para exibir.
                  </div>
                )}
              </section>

              <section className="painel painel-comparacao" id="comparacao">
                <div className="titulo-painel">
                  <div>
                    <span className="numero-secao">03</span>

                    <div>
                      <h2>COMPARADOR DE MEMÓRIAS</h2>
                      <p>
                        Escolha duas capturas e investigue a evolução visual
                        do site ao longo do tempo.
                      </p>
                    </div>
                  </div>
                </div>

                {!fantasma ? (
                  <div className="memorias-vazias">
                    Investigue um domínio para começar a comparar versões.
                  </div>
                ) : (
                  <>
                    <div className="selecao-comparacao">
                      <div className="versao-selecionada">
                        <span>VERSÃO ANTIGA</span>

                        <strong>
                          {capturaAntiga
                            ? formatarDataHora(capturaAntiga)
                            : 'Selecione uma captura abaixo'}
                        </strong>

                        {capturaAntiga && (
                          <a
                            href={enderecoArquivo(capturaAntiga)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Abrir versão ↗
                          </a>
                        )}
                      </div>

                      <div className="separador-comparacao">VS</div>

                      <div className="versao-selecionada">
                        <span>VERSÃO NOVA</span>

                        <strong>
                          {capturaNova
                            ? formatarDataHora(capturaNova)
                            : 'Selecione outra captura'}
                        </strong>

                        {capturaNova && (
                          <a
                            href={enderecoArquivo(capturaNova)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Abrir versão ↗
                          </a>
                        )}
                      </div>
                    </div>

                    <p className="instrucao-comparacao">
                      Selecione duas capturas no arquivo de memórias. A primeira
                      será a versão mais antiga e a segunda, a mais recente.
                    </p>

                    <div className="acoes-comparacao">
                      <button
                        type="button"
                        className="botao-comparacao"
                        disabled={
                          !capturaAntiga ||
                          !capturaNova ||
                          capturaAntiga === capturaNova
                        }
                        onClick={() => setMostrarComparacao(true)}
                      >
                        Comparar versões ↗
                      </button>

                      <button
                        type="button"
                        className="botao-limpar-comparacao"
                        onClick={limparComparacao}
                      >
                        Limpar seleção
                      </button>
                    </div>

                    {mostrarComparacao && capturaAntiga && capturaNova && (
                      <div className="resultado-comparacao">
                        <div className="painel-versao">
                          <header>
                            <strong>VERSÃO ANTIGA</strong>
                            <span>{anoDaCaptura(capturaAntiga)}</span>
                          </header>

                          <iframe
                            title={`Versão antiga de ${fantasma.dominio}`}
                            src={enderecoArquivo(capturaAntiga)}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />

                          <a
                            href={enderecoArquivo(capturaAntiga)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Abrir versão antiga em nova aba ↗
                          </a>
                        </div>

                        <div className="painel-versao">
                          <header>
                            <strong>VERSÃO NOVA</strong>
                            <span>{anoDaCaptura(capturaNova)}</span>
                          </header>

                          <iframe
                            title={`Versão nova de ${fantasma.dominio}`}
                            src={enderecoArquivo(capturaNova)}
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />

                          <a
                            href={enderecoArquivo(capturaNova)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Abrir versão nova em nova aba ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </section>

              <section className="painel arquivo-memorias" id="memorias">
                <div className="cabecalho-memorias">
                  <div className="titulo-painel">
                    <div>
                      <span className="numero-secao">04</span>

                      <div>
                        <h2>ARQUIVO DE MEMÓRIAS</h2>

                        <h3>
                          {anoSelecionado
                            ? `Memórias de ${anoSelecionado}`
                            : 'Versões preservadas'}
                        </h3>

                        <p>
                          Abra uma captura ou selecione duas versões para
                          compará-las.
                        </p>
                      </div>
                    </div>
                  </div>

                  <span className="contador-registros">
                    {capturasFiltradas.length.toLocaleString('pt-BR')} registros
                  </span>
                </div>

                {capturasVisiveis.length > 0 ? (
                  <>
                    <div className="tabela-memorias">
                      <div className="linha-tabela cabecalho-tabela">
                        <span>DATA E HORA</span>
                        <span>STATUS</span>
                        <span>VISUALIZAR</span>
                        <span>COMPARAR</span>
                      </div>

                      {capturasVisiveis.map((captura) => (
                        <div className="linha-tabela" key={captura}>
                          <span className="data-memoria">
                            <b>↗</b>
                            {formatarDataHora(captura)}
                          </span>

                          <span className="status-captura">
                            <i />
                            200
                          </span>

                          <a
                            href={enderecoArquivo(captura)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Visualizar versão ↗
                          </a>

                          <button
                            type="button"
                            className={`botao-selecionar-captura ${
                              capturaAntiga === captura ||
                              capturaNova === captura
                                ? 'selecionada'
                                : ''
                            }`}
                            onClick={() => selecionarCaptura(captura)}
                          >
                            {capturaAntiga === captura
                              ? 'Antiga ✓'
                              : capturaNova === captura
                                ? 'Nova ✓'
                                : 'Selecionar'}
                          </button>
                        </div>
                      ))}
                    </div>

                    {capturasVisiveis.length < capturasFiltradas.length && (
                      <button
                        type="button"
                        className="carregar-mais"
                        onClick={() => setLimiteCapturas((limite) => limite + 20)}
                      >
                        <span>⌄</span>

                        <b>
                          Carregar mais memórias
                          <small>
                            {(
                              capturasFiltradas.length - capturasVisiveis.length
                            ).toLocaleString('pt-BR')}{' '}
                            restantes
                          </small>
                        </b>
                      </button>
                    )}
                  </>
                ) : (
                  <div className="memorias-vazias">
                    As capturas arquivadas serão exibidas aqui após a
                    investigação.
                  </div>
                )}

                <p className="aviso-dados">
                  Os dados representam as capturas retornadas pela consulta à
                  Wayback Machine. A quantidade apresentada não garante que
                  todas as capturas históricas existentes tenham sido
                  recuperadas. O nível de abandono é uma estimativa e não
                  confirma que o site esteja fora do ar.
                </p>
              </section>
            </div>
          </div>

          <aside className="coluna-direita">
            <div className="acoes-topo">
              <button
                type="button"
                title="Alternar aparência"
                aria-label="Alternar aparência"
                onClick={() =>
                  document.documentElement.classList.toggle('tema-claro')
                }
              >
                ☾
              </button>

              <span>
                <i /> Conectado
              </span>
            </div>

            <section className="painel-recentes">
              <header>
                <div>
                  <span className="icone-relogio">◷</span>
                  <h2>CAPTURAS RECENTES</h2>
                </div>

                <a href="#memorias">Ver todas →</a>
              </header>

              {capturasRecentes.length > 0 ? (
                <div className="lista-recentes">
                  {capturasRecentes.map((captura, indice) => (
                    <article className="captura-recente" key={captura}>
                      <a
                        className="miniatura-link"
                        href={enderecoArquivo(captura)}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir captura de ${formatarDataHora(captura)}`}
                      >
                        <Miniatura indice={indice} />
                      </a>

                      <div>
                        <time>{formatarDataHora(captura)}</time>

                        <a
                          href={enderecoArquivo(captura)}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Visualizar versão arquivada ↗
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="recentes-vazias">
                  <span>◷</span>

                  <p>
                    Investigue um domínio para visualizar as capturas recentes
                    preservadas no arquivo.
                  </p>
                </div>
              )}

              <div className="cartao-frase">
                <span className="fantasma-mini">
                  <IconeFantasma tamanho={27} />
                </span>

                <p>
                  Cada clique é uma memória.
                  <br />
                  Cada memória é um fantasma.
                </p>

                <div className="onda-cartao" />
              </div>
            </section>
          </aside>
        </div>

        <footer className="rodape">
          <span>
            INTERNET FANTASMA <b>/</b> ARQUIVO HISTÓRICO
          </span>

          <span>FEITO PARA DESCOBRIR O QUE A INTERNET GUARDOU.</span>
        </footer>
      </main>
    </div>
  )
}
