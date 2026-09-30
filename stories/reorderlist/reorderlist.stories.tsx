import type { StoryObj } from '@storybook/react';
import meta from './meta';
import { RELEASE_TASKS } from '../sample-data';

export default { ...meta, title: 'UI Widgets/Reorder List', tags: ['autodocs'] };
type Story = StoryObj<typeof meta>;

/** Press and hold a row, then drag it. Needs a `GestureHandlerRootView` above it. */
export const Default: Story = {
  args: {
    dataset: RELEASE_TASKS,
  },
  parameters: {
    note: 'Press and hold a row, then drag it up or down.',
    source: '<GestureHandlerRootView>\n  <ReorderList dataset={tasks} />\n</GestureHandlerRootView>',
  },
};

/** A Studio variable: `{ dataSet }` wrapper with a custom label column. */
export const StudioBinding: Story = {
  args: {
    dataset: { dataSet: RELEASE_TASKS.map(({ id, label }) => ({ id, task: label })) },
    labelField: 'task',
  },
  parameters: {
    source: '<ReorderList dataset={Variables.tasks} labelField="task" />',
  },
};

/** An empty dataset renders an empty list rather than erroring. */
export const EmptyDataset: Story = {
  args: {
    dataset: [],
  },
};
