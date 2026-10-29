import { FastifyInstance } from 'fastify'
import { obterFantasma } from '../controladores/fantasmaControlador'

export async function fantasmaRotas(servidor: FastifyInstance) {
  servidor.get('/api/status', async () => {
    return { funcionando: true }
  })

  servidor.get('/api/fantasmas/:dominio', obterFantasma)
}