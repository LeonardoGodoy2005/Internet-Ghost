import Fastify from 'fastify'
import cors from '@fastify/cors'
import { fantasmaRotas } from './rotas/fantasmaRotas'

const servidor = Fastify({
  logger: true
})

async function iniciarServidor() {
  await servidor.register(cors)

  await servidor.register(fantasmaRotas)

  try {
    await servidor.listen({
      port: 3333,
      host: '0.0.0.0'
    })

    console.log(
      '👻 Internet Ghosts rodando em http://localhost:3333'
    )
  } catch (erro) {
    servidor.log.error(erro)
    process.exit(1)
  }
}

iniciarServidor()