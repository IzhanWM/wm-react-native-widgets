/**
 * Department-store use case: one associate app, a different screen per store
 * section. The backend serves each section's spec and its aisle data; the app
 * binds both and never ships a section-specific build.
 *
 * Every screen reads the same data shape — `section` (who and where) and
 * `items` (a live variable's rows, still in `dataSet`) — and reports work back
 * through custom actions the page turns into service-variable calls.
 */
import type { ServerDrivenSpec } from '@components/serverdrivenview';

/** Header shared by every section: name, aisle and the associate on shift. */
const header = (subtitle: string) => ({
  header: { type: 'Row', props: { gap: 12 }, children: ['headerText', 'aisleBadge'] },
  headerText: { type: 'Column', props: { gap: 2, flex: 1 }, children: ['sectionName', 'sectionSubtitle'] },
  sectionName: { type: 'Heading', props: { level: 2, text: { $data: '/section/name' } } },
  sectionSubtitle: {
    type: 'Text',
    props: { variant: 'caption', text: { $template: `${subtitle} · \${$data/section/associate}` } },
  },
  aisleBadge: { type: 'Badge', props: { text: { $template: 'Aisle ${$data/section/aisle}' }, color: '#1F2937' } },
});

/**
 * Grocery runs an expiry sweep: rows due within a day are flagged, the
 * associate ticks what was pulled and counts what is left on the shelf.
 * Rows are copied into state from `data` so they can be edited.
 */
export const GROCERY_SPEC: ServerDrivenSpec = {
  root: 'screen',
  state: { sweep: { $data: '/items/dataSet' } },
  elements: {
    screen: { type: 'Column', props: { gap: 16 }, children: ['header', 'sweepCard', 'submit'] },
    ...header('Expiry sweep'),
    sweepCard: { type: 'Card', props: { title: 'Perishables on this aisle' }, children: ['rows'] },
    rows: { type: 'Column', props: { gap: 12 }, repeat: { statePath: '/sweep', key: 'sku' }, children: ['row'] },
    row: { type: 'Column', props: { gap: 6 }, children: ['rowHead', 'pulled', 'shelfCount', 'rowDivider'] },
    rowHead: { type: 'Row', children: ['product', 'expiry'] },
    product: { type: 'Text', props: { variant: 'title', size: 15, text: { $item: 'name' }, style: { flex: 1 } } },
    expiry: {
      type: 'Badge',
      props: {
        text: {
          $cond: { $item: 'daysLeft', lte: 0 },
          $then: 'Expires today',
          $else: { $template: '${$item/daysLeft} days left' },
        },
        color: {
          $cond: { $item: 'daysLeft', lte: 0 },
          $then: '#DC2626',
          $else: { $cond: { $item: 'daysLeft', lte: 2 }, $then: '#D97706', $else: '#15803D' },
        },
      },
    },
    pulled: {
      type: 'Checkbox',
      props: { label: 'Pulled from shelf', checked: { $bindItem: 'pulled' } },
      visible: { $item: 'daysLeft', lte: 2 },
    },
    shelfCount: { type: 'Stepper', props: { label: 'Left on shelf', value: { $bindItem: 'onShelf' }, max: 99 } },
    rowDivider: { type: 'Divider' },
    submit: {
      type: 'Button',
      props: { label: 'Submit sweep', fullWidth: true },
      on: {
        press: {
          action: 'submitSweep',
          params: { aisle: { $data: '/section/aisle' }, items: { $state: '/sweep' } },
        },
      },
    },
  },
};

/**
 * Electronics checks demo units and price tags: a tag that disagrees with the
 * system price is flagged, and an issue goes straight to the service desk.
 */
export const ELECTRONICS_SPEC: ServerDrivenSpec = {
  root: 'screen',
  state: { demos: { $data: '/items/dataSet' } },
  elements: {
    screen: { type: 'Column', props: { gap: 16 }, children: ['header', 'demoCard', 'handover'] },
    ...header('Demo & price-tag check'),
    demoCard: { type: 'Card', props: { title: 'Display units' }, children: ['rows'] },
    rows: { type: 'Column', props: { gap: 12 }, repeat: { statePath: '/demos', key: 'sku' }, children: ['row'] },
    row: { type: 'Column', props: { gap: 6 }, children: ['product', 'prices', 'tagWarning', 'working', 'report', 'rowDivider'] },
    product: { type: 'Text', props: { variant: 'title', size: 15, text: { $item: 'name' } } },
    prices: {
      type: 'Text',
      props: { variant: 'caption', text: { $template: 'Tag $${$item/shelfPrice} · System $${$item/systemPrice}' } },
    },
    tagWarning: {
      type: 'Badge',
      props: { text: 'Re-print price tag', color: '#DC2626' },
      visible: { $item: 'shelfPrice', neq: { $item: 'systemPrice' } },
    },
    working: { type: 'Switch', props: { label: 'Demo unit working', value: { $bindItem: 'demoWorking' } } },
    report: {
      type: 'Button',
      props: { label: 'Report to service desk', variant: 'outline' },
      visible: { $item: 'demoWorking', not: true },
      on: { press: { action: 'reportIssue', params: { sku: { $item: 'sku' }, name: { $item: 'name' } } } },
    },
    rowDivider: { type: 'Divider' },
    handover: { type: 'Card', props: { title: 'Shift handover', subtitle: 'The next associate scans this to take the section' }, children: ['qr'] },
    qr: {
      type: 'QrCode',
      props: { value: { $template: 'wm-store://handover/${$data/section/id}/${$data/section/aisle}' }, size: 120 },
    },
  },
};

/**
 * Apparel watches size runs: a bar per style shows stock by size, and the
 * associate picks a size to replenish from the stockroom.
 */
export const APPAREL_SPEC: ServerDrivenSpec = {
  root: 'screen',
  state: { picked: {} },
  elements: {
    screen: { type: 'Column', props: { gap: 16 }, children: ['header', 'fitting', 'styles'] },
    ...header('Size-run check'),
    fitting: { type: 'Card', props: { title: 'Fitting rooms' }, children: ['queue'] },
    queue: {
      type: 'Row',
      children: ['queueText', 'queueBadge'],
    },
    queueText: { type: 'Text', props: { text: { $template: '${$data/section/fittingQueue} customers waiting' }, style: { flex: 1 } } },
    queueBadge: {
      type: 'Badge',
      props: { text: 'Send help', color: '#DC2626' },
      visible: { $data: '/section/fittingQueue', gte: 4 },
    },
    styles: { type: 'Column', props: { gap: 12 }, repeat: { dataPath: '/items', key: 'style' }, children: ['styleCard'] },
    styleCard: { type: 'Card', props: { title: { $item: 'name' }, subtitle: { $item: 'style' } }, children: ['sizes', 'legend', 'picker', 'replenish'] },
    sizes: { type: 'SegmentProgress', props: { dataset: { $item: 'sizes' }, valueField: 'onHand', total: { $item: 'capacity' }, barHeight: 14 } },
    legend: {
      type: 'Text',
      props: { variant: 'caption', text: { $template: '${$item/onHandTotal} of ${$item/capacity} on the floor' } },
    },
    picker: { type: 'Row', props: { wrap: true }, repeat: { itemPath: 'sizes', key: 'id' }, children: ['sizeChip'] },
    sizeChip: {
      type: 'Button',
      props: {
        label: { $item: 'label' },
        variant: { $cond: { $state: '/picked/size', eq: { $item: 'label' } }, $then: 'primary', $else: 'secondary' },
      },
      on: { press: { action: 'setState', params: { statePath: '/picked/size', value: { $item: 'label' } } } },
    },
    replenish: {
      type: 'Button',
      props: {
        label: {
          $cond: { $state: '/picked/size' },
          $then: { $template: 'Request size ${/picked/size} from stockroom' },
          $else: 'Pick a size to replenish',
        },
        disabled: { $cond: { $state: '/picked/size' }, $then: false, $else: true },
        fullWidth: true,
      },
      on: {
        press: [
          { action: 'requestReplenishment', params: { style: { $item: 'style' }, size: { $state: '/picked/size' } } },
          { action: 'setState', params: { statePath: '/picked', value: {} } },
        ],
      },
    },
  },
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL'];

/**
 * What the backend returns per section: the screen to show and the aisle's
 * data. In Studio these are two service variables; here, one lookup.
 */
export const STORE_SECTIONS: Record<string, { label: string; spec: ServerDrivenSpec; data: unknown }> = {
  grocery: {
    label: 'Grocery',
    spec: GROCERY_SPEC,
    data: {
      section: { id: 'grocery', name: 'Fresh Grocery', aisle: 'G4', associate: 'Priya N.' },
      items: {
        dataSet: [
          { sku: 'MLK-2L', name: 'Whole milk 2 L', daysLeft: 0, onShelf: 6, pulled: false },
          { sku: 'YGT-500', name: 'Greek yogurt 500 g', daysLeft: 2, onShelf: 14, pulled: false },
          { sku: 'SPN-200', name: 'Baby spinach 200 g', daysLeft: 5, onShelf: 9, pulled: false },
        ],
      },
    },
  },
  electronics: {
    label: 'Electronics',
    spec: ELECTRONICS_SPEC,
    data: {
      section: { id: 'electronics', name: 'Electronics', aisle: 'E2', associate: 'Marco D.' },
      items: {
        dataSet: [
          { sku: 'TV-55OLED', name: '55" OLED TV', shelfPrice: 1299, systemPrice: 1199, demoWorking: true },
          { sku: 'HP-NC700', name: 'Noise-cancelling headphones', shelfPrice: 249, systemPrice: 249, demoWorking: false },
          { sku: 'TAB-11', name: '11" tablet', shelfPrice: 499, systemPrice: 499, demoWorking: true },
        ],
      },
    },
  },
  apparel: {
    label: 'Apparel',
    spec: APPAREL_SPEC,
    data: {
      section: { id: 'apparel', name: 'Womenswear', aisle: 'A7', associate: 'Lena K.', fittingQueue: 5 },
      items: {
        dataSet: [
          {
            style: 'WW-DNM-204',
            name: 'High-rise denim',
            capacity: 60,
            onHandTotal: 31,
            sizes: SIZES.map((label, i) => ({ id: label, label, onHand: [3, 9, 2, 12, 5][i] })),
          },
        ],
      },
    },
  },
};
