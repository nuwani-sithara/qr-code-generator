import QRGenerator from "../components/QRGenerator";

export default function HomePage() {
  return (
    <main className="page">
      <div className="card">
        <header className="header">
          <h1>QR Code Generator</h1>
          <p>Generate high-resolution QR codes with custom styling.</p>
        </header>
        <QRGenerator />
      </div>
    </main>
  );
}
