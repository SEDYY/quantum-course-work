import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Компьютерный салон',
  description: 'Система управления компьютерным салоном',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  );
}