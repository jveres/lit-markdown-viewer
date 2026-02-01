// Main entry point - exports all components
export { MarkdownViewer } from './components/markdown-viewer/markdown-viewer';
export { DemoPage } from './demo-page';

// Also import demo-page for side effects (registers the custom element)
import './demo-page';
