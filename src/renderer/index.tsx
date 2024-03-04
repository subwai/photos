import { createRoot } from 'react-dom/client';
import 'utils/configure-bluebird';

import App from 'renderer/App';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(<App />);
