import './globals.css'
import type { Metadata } from 'next'
import { Montserrat } from 'next/font/google'
import { CartProvider } from './home/cart/CartContext'

const montserrat = Montserrat({
  subsets: ['vietnamese', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Hệ thống bán hàng trực tuyến',
  description: 'Nền tảng quản lý và bán hàng trực tuyến chuyên nghiệp',
  keywords: 'bán hàng, trực tuyến, ecommerce, shop',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body className={montserrat.className}>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  )
}
