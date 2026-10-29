
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fantasmaRotas } from '../backend/src/rotas/fantasmaRotas.js'

const servidor = Fastify({
  logger: true
})

servidor.register(cors)
servidor.register(fantasmaRotas)

const servidorPronto = servidor.ready()

export default async function handler(
  requisicao: import('node:http').IncomingMessage,
  resposta: import('node:http').ServerResponse
) {
  await servidorPronto

  servidor.server.emit('request', requisicao, resposta)
}
