// app/layout.js
export const metadata = {
  title: 'Quantum Service',
  description: 'Информационная система для сервисного центра',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>
        <nav style={{ padding: '10px', background: '#f0f0f0' }}>
          <a href="/" style={{ marginRight: '10px' }}>Главная</a>
          <a href="/login" style={{ marginRight: '10px' }}>Вход</a>
          <a href="/register" style={{ marginRight: '10px' }}>Регистрация</a>
          <a href="/products" style={{ marginRight: '10px' }}>Товары</a>
          <a href="/admin/service-requests" style={{ marginRight: '10px' }}>Заявки</a>
          <a href="/admin/sales" style={{ marginRight: '10px' }}>Продажи</a>
          <a href="/admin/reports" style={{ marginRight: '10px' }}>Отчёты</a>
          <a href="/admin/stock" style={{ marginRight: '10px' }}>Склад</a>
        </nav>
        <main style={{ padding: '20px' }}>{children}</main>
      </body>
    </html>
  );
}