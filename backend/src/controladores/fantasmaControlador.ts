import { FastifyReply, FastifyRequest } from 'fastify'
import { buscarHistorico } from '../servicos/arquivoHistoricoServico'

interface ParametrosFantasma {
  dominio: string
}

export async function obterFantasma(
  requisicao: FastifyRequest<{
    Params: ParametrosFantasma
  }>,
  resposta: FastifyReply
) {
  try {
    const dominio = requisicao.params.dominio

    if (!dominio) {
      return resposta.status(400).send({
        erro: 'Informe um domínio.'
      })
    }

    const fantasma = await buscarHistorico(dominio)

    return resposta.send(fantasma)
  } catch (erro) {
    const mensagem =
      erro instanceof Error
        ? erro.message
        : 'Erro desconhecido.'

    return resposta.status(500).send({
      erro: mensagem
    })
  }
}