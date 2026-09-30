import type { StoryObj } from '@storybook/react';
import meta from '../meta';
import { RELEASE_TASKS } from '../../sample-data';

/** The props that visibly change the list, one per story. */
export default { ...meta, title: 'UI Widgets/Reorder List/Props' };
type Story = StoryObj<typeof meta>;

/** `itemHeight` — compact rows. */
export const ItemHeight: Story = {
  args: { dataset: RELEASE_TASKS, itemHeight: 40 },
  parameters: { source: '<ReorderList dataset={tasks} itemHeight={40} />' },
};

/** `rowColor` — a tinted row background. */
export const RowColor: Story = {
  args: { dataset: RELEASE_TASKS, rowColor: '#F0FDF4' },
  parameters: { source: '<ReorderList dataset={tasks} rowColor="#F0FDF4" />' },
};

/** `labelColor` — colored label text. */
export const LabelColor: Story = {
  args: { dataset: RELEASE_TASKS, labelColor: '#1D4ED8' },
  parameters: { source: '<ReorderList dataset={tasks} labelColor="#1D4ED8" />' },
};

/** `draggingRowColor` — the lifted row turns amber. Press and hold a row to see it. */
export const DraggingRowColor: Story = {
  args: { dataset: RELEASE_TASKS, draggingRowColor: '#FEF3C7' },
  parameters: { source: '<ReorderList dataset={tasks} draggingRowColor="#FEF3C7" />' },
};

/** `showSeparator` — no hairlines between rows. */
export const SeparatorHidden: Story = {
  args: { dataset: RELEASE_TASKS, showSeparator: false },
  parameters: { source: '<ReorderList dataset={tasks} showSeparator={false} />' },
};
