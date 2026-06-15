import {buildMessageTemplate, extractNumericLeaves} from '@ros/messageTemplate';

describe('message templates', () => {
  it('builds nested ROS message skeletons', () => {
    expect(
      buildMessageTemplate(
        [
          {
            type: 'demo/Root',
            fieldnames: ['enabled', 'pose'],
            fieldtypes: ['bool', 'demo/Pose'],
            fieldarraylen: [-1, -1],
          },
          {
            type: 'demo/Pose',
            fieldnames: ['x', 'stamp'],
            fieldtypes: ['float64', 'time'],
            fieldarraylen: [-1, -1],
          },
        ],
        'demo/Root',
      ),
    ).toEqual({enabled: false, pose: {x: 0, stamp: {secs: 0, nsecs: 0}}});
  });

  it('extracts numeric leaf values for plotting', () => {
    expect(extractNumericLeaves({pose: {x: 1, y: -2}, label: 'skip', values: [3]})).toEqual({
      'pose.x': 1,
      'pose.y': -2,
      'values[0]': 3,
    });
  });
});
