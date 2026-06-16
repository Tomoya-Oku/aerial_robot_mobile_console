import {pushHistory} from '@lib/storage';

describe('pushHistory', () => {
  it('adds a new value to the front', () => {
    expect(pushHistory(['b'], 'a')).toEqual(['a', 'b']);
  });

  it('de-duplicates and moves an existing value to the front', () => {
    expect(pushHistory(['a', 'b', 'c'], 'c')).toEqual(['c', 'a', 'b']);
  });

  it('ignores blank values', () => {
    expect(pushHistory(['a'], '   ')).toEqual(['a']);
  });

  it('caps the history length', () => {
    const list = ['1', '2', '3'];
    expect(pushHistory(list, '0', 3)).toEqual(['0', '1', '2']);
  });
});
