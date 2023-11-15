import { z } from "zod"
import { mangrovePriceResponseSchema } from "./mangrove-price-api"

export const cryptoComparePriceResponseSchema = z.record(z.number())

export type CryptoComparePriceResponse = z.infer<
  typeof cryptoComparePriceResponseSchema
>

const partialMangrovePriceResponseSchema = mangrovePriceResponseSchema.partial({
  open: true,
  high: true,
  low: true,
  date: true,
  volume: true,
})

type PartialMangrovePriceResponseSchema = z.infer<
  typeof partialMangrovePriceResponseSchema
>

export function convertToMangroveApiResponse(
  response: Record<string, number>,
): PartialMangrovePriceResponseSchema {
  const tokenName = Object.keys(response)[0]
  if (!tokenName) throw new Error("Invalid response from CryptoCompare API")
  return mangrovePriceResponseSchema.partial({}).parse({
    close: response[tokenName],
  })
}
