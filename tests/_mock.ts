import { ObjectId } from 'mongodb'

const nonexistingId = new ObjectId();


export const BAR_ROWS = [
  { title: 'bar1', _id: new ObjectId() },
  { title: 'bar2', _id: new ObjectId() }
];

const [BAR1, BAR2] = BAR_ROWS;

export const FOO_ROWS = [
  {
    name: 'foo1',
    bar: BAR1._id,
    subdoc: { field: 111, bar: BAR2._id, subsubdoc: { param: 123 } },
    subarray: [{ field: 222, bar: BAR1._id }],
    refarray:[nonexistingId]
  },

  // corrrect with optional field set as well
  {
    name: 'foo2',
    bar: BAR1._id,
    barOptional: BAR2._id 
  },

  // incorrect (required, but missing), will trigger validation error
  {
    name: 'foo3',
    bar: null
  },

  // incorrect, broken reference (nonexisting target)
  {
    name: 'foo3',
    bar: nonexistingId
  }
];
