// Sample JSX test file
function App() {
  const [count, setCount] = React.useState(0);
  
  return (
    <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ color: "#667eea" }}>🧪 JSX Preview Test</h1>
      <p style={{ fontSize: 24, marginBottom: 20 }}>Count: {count}</p>
      
      <button 
        onClick={() => setCount(count + 1)}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer",
          marginRight: "10px"
        }}
      >
        Increment
      </button>
      
      <button 
        onClick={() => setCount(0)}
        style={{
          padding: "12px 24px",
          fontSize: "16px",
          background: "#f0f0f0",
          color: "#333",
          border: "none",
          borderRadius: "8px",
          cursor: "pointer"
        }}
      >
        Reset
      </button>
    </div>
  );
}
