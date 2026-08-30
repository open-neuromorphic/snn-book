import { describe, expect, it } from 'vitest';
import { injectTag } from './inject-analytics.mjs';

const page = (head) => `<!DOCTYPE html><html><head>${head}</head><body></body></html>`;

describe('injectTag', () => {
  it('puts the tag last in <head>', () => {
    const out = injectTag(page('<title>x</title>'));
    expect(out).toContain('<title>x</title><script defer');
    expect(out).toContain('data-website-id="23a3d87e-e641-45a6-a836-725eb958d725"');
    expect(out).toContain('</script></head>');
  });

  it('leaves an already-tagged page alone', () => {
    const once = injectTag(page('<title>x</title>'));
    expect(injectTag(once)).toBeNull();
  });

  it('leaves a page without a <head> alone', () => {
    expect(injectTag('<p>fragment</p>')).toBeNull();
  });
});
