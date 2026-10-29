import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fantasmaRotas } from '../backend/src/rotas/fantasmaRotas.js'

const servidor = Fastify({ logger: true })

servidor.register(cors)
servidor.register(fantasmaRotas)

servidor.get('/api/debug', async (requisicao) => ({
  funcionando: true,
  caminho: requisicao.url,
  metodo: requisicao.method
}))

export default async function handler(
  requisicao: import('node:http').IncomingMessage,
  resposta: import('node:http').ServerResponse
) {
  await servidor.ready()
  servidor.server.emit('request', requisicao, resposta)
}