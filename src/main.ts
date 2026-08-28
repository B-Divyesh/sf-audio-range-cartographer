import './styles.css';
import { App, renderLegalPage } from './app';

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('App root not found');

if (location.pathname === '/privacy' || location.pathname === '/terms') {
  renderLegalPage(root, location.pathname.slice(1) as 'privacy' | 'terms');
} else {
  new App(root).start();
}
