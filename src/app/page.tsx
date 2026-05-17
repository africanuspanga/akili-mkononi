export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: 720 }}>
      <h1>AKILI MKONONI</h1>
      <p>SMS-based AI assistant for Tanzania.</p>
      <ul>
        <li>
          <code>GET /api/webhook/sms</code> — MobiShastra inbound webhook
        </li>
        <li>
          <code>GET /api/health</code> — health check
        </li>
      </ul>
    </main>
  );
}
