export default function GamePage() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <iframe
        src="/game.html"
        style={{ width: '100%', height: '100%', border: 'none' }}
        title="GLB Viewer"
      />
    </div>
  );
}
