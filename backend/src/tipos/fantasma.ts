
export interface Fantasma {
  dominio: string
  primeiraCaptura: string | null
  ultimaCaptura: string | null
  totalCapturas: number
  anosAtivos: number[]
  capturas: string[]
  nivelAbandono: number
  estado: 'VIVO' | 'ADORMECIDO' | 'ABANDONADO' | 'FANTASMA'
}
