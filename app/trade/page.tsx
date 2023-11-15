import Header from "./sections/header/header"
import Market from "./sections/market/market"
import Book from "./sections/orderbook/orderbook"
import Trade from "./sections/trade/trade"

export default function Page() {
  return (
    <div className="py-2 h-full">
      <Header />
      <div className="grid grid-cols-4 gap-3 h-full">
        <div className="sm:col-span-4 md:col-span-2 lg:col-span-1 border border-solid border-muted rounded-md">
          <Trade />
        </div>
        <div className="sm:col-span-4 md:col-span-2 lg:col-span-1 border border-solid border-muted rounded-md">
          <Book />
        </div>
        <div className="sm:col-span-4 md:col-span-4 lg:col-span-2 border border-solid border-muted rounded-md">
          <Market />
        </div>
      </div>
    </div>
  )
}
