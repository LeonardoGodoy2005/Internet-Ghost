
import { FastifyInstance } from 'fastify'
import { obterFantasma } from '../controladores/fantasmaControlador'

export async function fantasmaRotas(servidor: FastifyInstance) {
  servidor.get('/api/status', async () => {
    return { funcionando: true }
  })

  servidor.get('/api/fantasmas', async (requisicao, resposta) => {
    const { dominio } = requisicao.query as { dominio?: string }

    if (!dominio) {
      return resposta.status(400).send({
        erro: 'Informe um domínio.'
      })
    }

    return obterFantasma(
      {
        ...requisicao,
        params: { dominio }
      } as Parameters<typeof obterFantasma>[0],
      resposta
    )
  })

  servidor.get('/api/fantasmas/:dominio', obterFantasma)
}
