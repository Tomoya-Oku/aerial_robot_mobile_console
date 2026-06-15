import {normalizeNs, nsJoin, serviceName} from '@ros/topics';

describe('ROS topic helpers', () => {
  it('normalizes namespaces', () => {
    expect(normalizeNs('dragon')).toBe('/dragon');
    expect(normalizeNs('/dragon/')).toBe('/dragon');
    expect(normalizeNs('/')).toBe('');
  });

  it('joins namespaces and names', () => {
    expect(nsJoin('/dragon', 'uav/nav')).toBe('/dragon/uav/nav');
    expect(nsJoin('', 'task_start')).toBe('/task_start');
  });

  it('normalizes service names', () => {
    expect(serviceName('rosapi/topics')).toBe('/rosapi/topics');
    expect(serviceName('/rosapi/topics')).toBe('/rosapi/topics');
  });
});
