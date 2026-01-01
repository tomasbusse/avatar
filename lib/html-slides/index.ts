/**
 * HTML Slides Module
 *
 * Self-contained HTML slide generation for interactive lesson rendering.
 * Each slide is designed for avatar vision capture via html2canvas.
 */

export {
  generateHtmlSlides,
  validateHtmlSlides,
  getSlideStats,
} from "./generator";

export type {
  HtmlSlide,
  SlideType,
  SlideGeneratorOptions,
  SlideTheme,
} from "./types";

export { DEFAULT_THEME, DEFAULT_OPTIONS } from "./types";
