import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title: 'Choose Hideaway | Homestay & Nhà hàng tại Ninh Bình',
  description: 'Một khoảng xanh giữa Ninh Bình. Khám phá Choose Hideaway tại 147 Nguyễn Huệ, đặt phòng homestay và đặt bàn nhà hàng trực tuyến. Hotline 0913 576 663.',
  icons: { icon: '/favicon.svg' },
};
export default function RootLayout({children}: Readonly<{children: React.ReactNode}>) {
  return <html lang="vi"><body>{children}</body></html>;
}
