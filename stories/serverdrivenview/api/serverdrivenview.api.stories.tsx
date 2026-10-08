import { ServerDrivenView } from '@components/serverdrivenview/serverdrivenview';
import type { StoryObj } from '@storybook/react';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import meta from '../meta';
import { Readout } from '../readout';
import { DUMMYJSON_API, DUMMYJSON_SPEC, PRODUCTS_API, PRODUCTS_SPEC, TEAL_THEME } from '../serverdrivenview.specs';

/** Specs that call REST APIs declared in the `api` schema. */
export default { ...meta, title: 'UI Widgets/Server Driven View/API' };
type Story = StoryObj<typeof meta>;

const PRODUCTS = [
  { id: 1, name: 'Cold brew', price: 4.5 },
  { id: 2, name: 'Oat latte', price: 5.25 },
  { id: 3, name: 'Matcha', price: 4.75 },
];

type Call = { method: string; url: string; auth?: string; body?: string };

/** Stands in for the backend: answers `demo.store.api` after a short delay and logs each call. */
function useMockBackend(fail: boolean) {
  const [calls, setCalls] = useState<Call[]>([]);
  useEffect(() => {
    const realFetch = globalThis.fetch;
    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (!url.startsWith('https://demo.store.api')) return realFetch(input, init);
      const headers = (init?.headers ?? {}) as Record<string, string>;
      setCalls((list) => [...list.slice(-3), { method: init?.method ?? 'GET', url, auth: headers.Authorization, body: init?.body as string }]);
      await new Promise((resolve) => setTimeout(resolve, 600));
      if (fail) return new Response(JSON.stringify({ message: 'Store service is down' }), { status: 503 });
      const { pathname, searchParams } = new URL(url);
      if (pathname.startsWith('/cart/')) {
        const product = PRODUCTS.find((p) => String(p.id) === pathname.split('/')[2]);
        return new Response(JSON.stringify(product), { status: 201 });
      }
      const q = (searchParams.get('q') ?? '').toLowerCase();
      return new Response(JSON.stringify({ items: PRODUCTS.filter((p) => p.name.toLowerCase().includes(q)) }));
    }) as typeof fetch;
    return () => {
      globalThis.fetch = realFetch;
    };
  }, [fail]);
  return calls;
}

/**
 * `listProducts` (`load: true`) fetches on mount and again as the search box
 * changes `$state/query`; the auth header reads a token from `data`. "Add"
 * calls `addToCart` by name, and its `onSuccess` writes the response to state.
 */
export const LoadAndCall: Story = {
  render: (args) => {
    const calls = useMockBackend(false);
    return (
      <View>
        <ServerDrivenView {...args} />
        <Readout label="requests" value={calls} />
      </View>
    );
  },
  args: { spec: PRODUCTS_SPEC, api: PRODUCTS_API, theme: TEAL_THEME, data: { session: { token: 'abc123' } } },
  parameters: {
    source: '<ServerDrivenView\n  spec={Variables.productsScreen.dataSet}\n  api={Variables.storeApi.dataSet}\n  theme={Variables.appTheme.dataSet}\n  data={{ session: Variables.session.dataSet }}\n/>',
  },
};

/** A failing API: `$api/listProducts/error` carries the server's message. */
export const RequestError: Story = {
  render: (args) => {
    const calls = useMockBackend(true);
    return (
      <View>
        <ServerDrivenView {...args} />
        <Readout label="requests" value={calls} />
      </View>
    );
  },
  args: { spec: PRODUCTS_SPEC, api: PRODUCTS_API, data: { session: { token: 'abc123' } } },
};

/**
 * A live public API (dummyjson.com, no key needed). Typing refetches after a
 * 400 ms debounce; tapping a product POSTs to `/carts/add` and `onSuccess`
 * writes the returned cart into state. Needs network access.
 */
export const LiveApi: Story = {
  args: { spec: DUMMYJSON_SPEC, api: DUMMYJSON_API, theme: TEAL_THEME },
  parameters: {
    source: '<ServerDrivenView spec={spec} api={{ baseUrl: "https://dummyjson.com", operations: { searchProducts: {...}, addToCart: {...} } }} />',
  },
};
