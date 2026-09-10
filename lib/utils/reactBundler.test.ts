import { describe, expect, it } from 'vitest';

import { bundleReact } from './reactBundler';

describe('bundleReact', () => {
  it('preserves valid TSX for the preview compiler', async () => {
    const result = await bundleReact('App.tsx', [{
      name: 'App.tsx',
      content: `
        import React, { useState } from 'react';

        interface Props {
          user: { name: string; skills: string[] };
        }

        export default function App({ user }: Props) {
          const [selected, setSelected] = useState<string | null>(null);
          return <button onClick={() => setSelected(user.skills[0])}>{selected ?? user.name}</button>;
        }
      `,
    }]);

    expect(result.error).toBeUndefined();
    expect(result.code).toContain('interface Props');
    expect(result.code).toContain('useState<string | null>');
    expect(result.code).not.toContain("from 'react'");
  });

  it('omits standard createRoot bootstrap files', async () => {
    const result = await bundleReact('src/App.tsx', [
      { name: 'src/main.tsx', content: 'ReactDOM.createRoot(root).render(<App />);' },
      { name: 'src/App.tsx', content: 'function App() { return <p>Ready</p>; }' },
    ]);

    expect(result.code).not.toContain('createRoot(root)');
    expect(result.code).toContain('function App()');
  });
});