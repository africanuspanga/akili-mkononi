export const metadata = {
  title: "AKILI MKONONI",
  description: "SMS-based AI assistant for Tanzania",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
