/**
 * Test script to verify JSX/TSX bundling
 * Run: node test-bundler.js
 */

import { bundleReact } from './lib/utils/reactBundler.js';

async function testBundler() {
  console.log('🧪 Testing JSX/TSX Bundler\n');

  // Test 1: Simple JSX with React.useState
  console.log('📋 Test 1: Simple JSX with hooks');
  const jsxResult = await bundleReact('App.jsx', [
    { name: 'App.jsx', content: `function App() {
  const [count, setCount] = React.useState(0);
  return <div><h1>Count: {count}</h1><button onClick={() => setCount(c => c + 1)}>Add</button></div>;
}` }
  ]);
  console.log('✅ JSX Result:', jsxResult.code ? 'SUCCESS' : 'FAILED', '\n');

  // Test 2: JSX with named imports
  console.log('📋 Test 2: JSX with named imports');
  const jsxWithImports = await bundleReact('App.jsx', [
    { name: 'App.jsx', content: `import { useState, useEffect } from 'react';
function App() {
  const [value, setValue] = useState('hello');
  useEffect(() => console.log('mounted'), []);
  return <div>{value}</div>;
}` }
  ]);
  console.log('✅ JSX with imports result:', jsxWithImports.code ? 'SUCCESS' : 'FAILED');
  console.log('Code preview:', jsxWithImports.code.substring(0, 100) + '...\n');

  // Test 3: TSX with TypeScript types
  console.log('📋 Test 3: TSX with TypeScript');
  const tsxResult = await bundleReact('Counter.tsx', [
    { name: 'Counter.tsx', content: `import { useState } from 'react';

interface CounterProps {
  initialValue: number;
}

function Counter({ initialValue }: CounterProps) {
  const [count, setCount] = useState<number>(initialValue);
  return <div><h1>{count}</h1><button onClick={() => setCount(c => c + 1)}>Add</button></div>;
}` }
  ]);
  console.log('✅ TSX Result:', tsxResult.code ? 'SUCCESS' : 'FAILED');
  console.log('Code preview:', tsxResult.code.substring(0, 150) + '...\n');

  // Test 4: TSX with React.FC
  console.log('📋 Test 4: TSX with React.FC');
  const tsxWithFC = await bundleReact('Component.tsx', [
    { name: 'Component.tsx', content: `import React from 'react';

const App: React.FC<{ title: string }> = ({ title }) => {
  const [count, setCount] = React.useState(0);
  return <h1>{title}: {count}</h1>;
};

export default App;` }
  ]);
  console.log('✅ TSX with React.FC result:', tsxWithFC.code ? 'SUCCESS' : 'FAILED');
  console.log('Code preview:', tsxWithFC.code.substring(0, 150) + '...\n');

  // Test 5: TSX with generic components
  console.log('📋 Test 5: TSX with generics');
  const tsxWithGenerics = await bundleReact('Generic.tsx', [
    { name: 'Generic.tsx', content: `import { useState } from 'react';

function List<T>({ items }: { items: T[] }) {
  return <ul>{items.map((item, i) => <li key={i}>{String(item)}</li>)}</ul>;
}

function App() {
  const [nums] = useState<number[]>([1, 2, 3]);
  return <List items={nums} />;
}` }
  ]);
  console.log('✅ TSX with generics result:', tsxWithGenerics.code ? 'SUCCESS' : 'FAILED');
  console.log('Code preview:', tsxWithGenerics.code.substring(0, 150) + '...\n');

  console.log('✨ All tests completed!');
}

testBundler().catch(console.error);
