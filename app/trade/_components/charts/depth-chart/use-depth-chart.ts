import Big from "big.js"
import React from "react"

import { useBook } from "@/hooks/use-book"
import useMarket from "@/providers/market.new"
import { clamp } from "@/utils/interpolation"
import type { CompleteOffer } from "@mangrovedao/mgv"
import { calculateCumulative } from "./utils"

function enablePageScroll() {
  document.body.classList.remove("overflow-hidden")
}

function disablePageScroll() {
  document.body.classList.add("overflow-hidden")
}

function removeCrossedOrders(
  bids: CompleteOffer[],
  asks: CompleteOffer[],
): { bids: CompleteOffer[]; asks: CompleteOffer[] } {
  for (let i = 0, j = 0; i < bids.length && j < asks.length; ) {
    const comparison = Big(bids?.[i]?.price ?? 0).cmp(asks?.[j]?.price ?? 0)

    if (comparison === -1) {
      break
    } else if (comparison === 0) {
      bids.splice(i, 1)
      asks.splice(j, 1)
    } else {
      asks.splice(j, 1)
    }
  }

  return { bids, asks }
}

export function useDepthChart() {
  const { currentMarket: market } = useMarket()
  const { book, isLoading } = useBook({})
  const [zoomDomain, setZoomDomain] = React.useState<undefined | number>()
  const [isScrolling, setIsScrolling] = React.useState(false)
  const baseDecimals = market?.base.displayDecimals
  const priceDecimals = market?.quote.priceDisplayDecimals
  const { asks, bids } = removeCrossedOrders(book?.bids ?? [], book?.asks ?? [])
  const cumulativeAsks = calculateCumulative(asks, true)
  const cumulativeBids = calculateCumulative(bids)
  const lowestAsk = asks?.[0]
  const highestBid = bids?.[0]
  const lowestBid = bids?.[bids.length - 1]
  const highestAsk = asks?.[asks.length - 1]
  const midPrice = React.useMemo(() => {
    if (!bids?.length || !asks?.length) return 0
    return ((lowestAsk?.price ?? 0) + (highestBid?.price ?? 0)) / 2
  }, [asks?.length, bids?.length, highestBid?.price, lowestAsk?.price])

  function onMouseOut() {
    setIsScrolling(false)
    enablePageScroll()
  }

  function onMouseOver() {
    setIsScrolling(true)
    disablePageScroll()
  }

  function onMouseMove() {
    setIsScrolling(false)
  }

  const minZoomDomain = React.useMemo(() => {
    return ((midPrice ?? 0) - (highestBid?.price ?? 0)) * 1.15
  }, [highestBid?.price, midPrice])

  React.useEffect(() => {
    // Handle one-side orderbook
    if (!asks?.length || !bids?.length) {
      setZoomDomain(
        !asks?.length ? highestBid?.price ?? 0 : highestAsk?.price ?? 0,
      )
      return
    }
    // set initial zoom domain
    const newZoomDomain = Math.max(
      (midPrice - (highestBid?.price || 0)) * 13,
      (midPrice - (lowestBid?.price || 0)) / 2,
      ((highestAsk?.price || 0) - midPrice) / 2,
    )

    setZoomDomain(newZoomDomain > midPrice ? midPrice : newZoomDomain)
  }, [
    asks?.length,
    bids?.length,
    highestAsk?.price,
    highestBid?.price,
    lowestBid?.price,
    midPrice,
  ])

  const { domain, range } = React.useMemo(() => {
    const domain =
      !asks?.length || !bids?.length
        ? [
            !asks?.length ? 0 : Big(lowestAsk?.price ?? 0).toNumber(),
            !asks?.length
              ? Big(highestBid?.price ?? 0).toNumber()
              : Big(highestAsk?.price ?? 0)
                  .times(1.1)
                  .toNumber(), // Add 10% to the highest ask
          ]
        : ([
            clamp(
              midPrice - (zoomDomain ?? 0),
              (lowestBid?.price ?? 0) * 0.9, // Subtract 10% from the lowest bid
              highestBid?.price ?? 0,
            ),
            clamp(
              midPrice + (zoomDomain ?? 0),
              lowestAsk?.price ?? 0,
              (highestAsk?.price ?? 0) * 1.1, // Add 10% to the highest ask
            ),
          ] as const)

    const range = [
      0,
      [...cumulativeBids, ...cumulativeAsks]
        .filter(
          (offer) =>
            Big(offer?.price ?? 0).gte(domain[0]) &&
            Big(offer?.price ?? 0).lte(domain[1]),
        )
        .map((offer) => offer.volume)
        .reduce((a, b) => Math.max(a, b), 0),
    ] as const

    return { domain, range }
  }, [
    asks?.length,
    bids?.length,
    cumulativeAsks,
    cumulativeBids,
    highestAsk?.price,
    highestBid?.price,
    lowestAsk?.price,
    lowestBid?.price,
    midPrice,
    zoomDomain,
  ])

  const onDepthChartZoom = ({ deltaY }: React.WheelEvent) => {
    if (
      !(
        zoomDomain &&
        midPrice &&
        lowestAsk &&
        lowestBid &&
        highestAsk &&
        highestBid
      )
    )
      return

    setZoomDomain(
      clamp(
        Math.max(
          1e-18,
          Math.min(
            Number.MAX_SAFE_INTEGER,
            zoomDomain * Math.exp(deltaY / 1000),
          ),
          minZoomDomain,
        ),
        0,
        midPrice,
      ),
    )
  }
  return {
    zoomDomain,
    onDepthChartZoom,
    cumulativeAsks,
    cumulativeBids,
    domain,
    range,
    midPrice,
    lowestAsk,
    highestBid,
    isScrolling,
    setIsScrolling,
    onMouseOut,
    onMouseOver,
    onMouseMove,
    baseDecimals,
    priceDecimals,
    market,
    asks,
    bids,
    isLoading,
  }
}
