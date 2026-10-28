import { FastifyInstance } from 'fastify'
import { obterFantasma } from '../controladores/fantasmaControlador'

export async function fantasmaRotas(
  servidor: FastifyInstance
) {
  servidor.get(
    '/api/fantasmas/:dominio',
    obterFantasma
  )
}