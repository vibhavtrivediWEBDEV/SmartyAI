import { describe, expect, it } from 'vitest';

import { getLanguageFromExtension } from './language';

describe('getLanguageFromExtension', () => {
  it.each([
    ['src/App.jsx', 'javascript'],
    ['src/App.tsx', 'typescript'],
    ['src/module.mts', 'typescript'],
    ['src/styles.scss', 'scss'],
    ['schema.graphql', 'graphql'],
    ['infra/main.tf', 'hcl'],
    ['shader.wgsl', 'wgsl'],
    ['README.mdx', 'mdx'],
    ['docker/Dockerfile', 'dockerfile'],
    ['scripts/Makefile', 'makefile'],
    ['config/.env.local', 'plaintext'],
  ])('maps %s to %s', (filename, language) => {
    expect(getLanguageFromExtension(filename)).toBe(language);
  });

  it('falls back to plaintext for unknown extensions', () => {
    expect(getLanguageFromExtension('archive.unknown')).toBe('plaintext');
  });
});