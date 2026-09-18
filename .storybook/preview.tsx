import type { Preview } from '@storybook/react';
import React from 'react';
import './preview.css';

const preview: Preview = {
  parameters: {
    options: {
      // Storybook evaluates this function on its own, outside the module, so it
      // has to be plain JS and may not reference anything defined above it.
      storySort: (a, b) => {
        const introOrder = ['Introduction/Getting Started', 'Introduction/Platform Support'];
        const isIntro = (title) => title.startsWith('Introduction/');
        const ai = isIntro(a.title);
        const bi = isIntro(b.title);
        if (ai !== bi) return ai ? -1 : 1;
        if (ai && bi) {
          const x = introOrder.indexOf(a.title);
          const y = introOrder.indexOf(b.title);
          if (x !== -1 || y !== -1) return (x === -1 ? 999 : x) - (y === -1 ? 999 : y);
        }
        return a.title === b.title
          ? (a.name ?? '').localeCompare(b.name ?? '', undefined, { numeric: true })
          : a.title.localeCompare(b.title, undefined, { numeric: true });
      },
    },
    docs: {
      codePanel: true,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [(Story) => <Story />],
};

export default preview;
