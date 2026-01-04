import { Pane } from 'https://cdn.jsdelivr.net/npm/tweakpane@4.0.5/dist/tweakpane.min.js';

const PANEL_WIDTH = 300;
const TOP_MARGIN = 20;
const SIDE_MARGIN = 20;

const DEFAULTS = {
  enabled: true,
  scanlineIntensity: 0.15,
  scanlineCount: 400,
  adaptiveIntensity: 0.5,
  brightness: 1.1,
  contrast: 1.05,
  saturation: 1.1,
  bloomIntensity: 0.2,
  bloomThreshold: 0.5,
  rgbShift: 0.0,
  vignetteStrength: 0.3,
  curvature: 0.15,
  flickerStrength: 0.01
};

export class CRTTweakPanel {
  constructor(options) {
    const { target, defaults = DEFAULTS, title = 'CRT SHADER' } = options;
    this.target = target;
    this.defaults = defaults;

    this.params = {
      enabled: { crtEnabled: target.getEnabled() },
      scanlines: {
        scanlineIntensity: target.get('scanlineIntensity') ?? defaults.scanlineIntensity,
        scanlineCount: target.get('scanlineCount') ?? defaults.scanlineCount,
        adaptiveIntensity: target.get('adaptiveIntensity') ?? defaults.adaptiveIntensity
      },
      color: {
        brightness: target.get('brightness') ?? defaults.brightness,
        contrast: target.get('contrast') ?? defaults.contrast,
        saturation: target.get('saturation') ?? defaults.saturation
      },
      effects: {
        bloomIntensity: target.get('bloomIntensity') ?? defaults.bloomIntensity,
        bloomThreshold: target.get('bloomThreshold') ?? defaults.bloomThreshold,
        rgbShift: target.get('rgbShift') ?? defaults.rgbShift,
        vignetteStrength: target.get('vignetteStrength') ?? defaults.vignetteStrength
      },
      distortion: {
        curvature: target.get('curvature') ?? defaults.curvature,
        flickerStrength: target.get('flickerStrength') ?? defaults.flickerStrength
      }
    };

    this.pane = new Pane({
      title,
      expanded: true
    });
    this.pane.element.style.width = `${PANEL_WIDTH}px`;

    const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    this.pane.element.style.position = 'fixed';
    this.pane.element.style.top = `${isMobile ? 10 : TOP_MARGIN + 60}px`;
    this.pane.element.style.right = `${isMobile ? 10 : SIDE_MARGIN}px`;

    this.setupFolders();
  }

  setupFolders() {
    this.pane.addBinding(this.params.enabled, 'crtEnabled', {
      label: 'Enabled'
    }).on('change', ev => {
      this.target.setEnabled(ev.value);
    });

    this.pane.addBlade({ view: 'separator' });

    const scanlines = this.pane.addFolder({ title: 'SCANLINES', expanded: true });
    scanlines.addBinding(this.params.scanlines, 'scanlineIntensity', { min: 0, max: 1, step: 0.01, label: 'Intensity' })
      .on('change', ev => this.target.set('scanlineIntensity', ev.value));
    scanlines.addBinding(this.params.scanlines, 'scanlineCount', { min: 50, max: 1200, step: 1, label: 'Count' })
      .on('change', ev => this.target.set('scanlineCount', ev.value));
    scanlines.addBinding(this.params.scanlines, 'adaptiveIntensity', { min: 0, max: 1, step: 0.01, label: 'Adaptive' })
      .on('change', ev => this.target.set('adaptiveIntensity', ev.value));

    const color = this.pane.addFolder({ title: 'COLOR', expanded: true });
    color.addBinding(this.params.color, 'brightness', { min: 0.6, max: 1.8, step: 0.01 })
      .on('change', ev => this.target.set('brightness', ev.value));
    color.addBinding(this.params.color, 'contrast', { min: 0.6, max: 1.8, step: 0.01 })
      .on('change', ev => this.target.set('contrast', ev.value));
    color.addBinding(this.params.color, 'saturation', { min: 0, max: 2, step: 0.01 })
      .on('change', ev => this.target.set('saturation', ev.value));

    const effects = this.pane.addFolder({ title: 'EFFECTS', expanded: true });
    effects.addBinding(this.params.effects, 'bloomIntensity', { min: 0, max: 1.5, step: 0.01, label: 'Bloom Intensity' })
      .on('change', ev => this.target.set('bloomIntensity', ev.value));
    effects.addBinding(this.params.effects, 'bloomThreshold', { min: 0, max: 1, step: 0.01, label: 'Bloom Threshold' })
      .on('change', ev => this.target.set('bloomThreshold', ev.value));
    effects.addBinding(this.params.effects, 'rgbShift', { min: 0, max: 1, step: 0.01, label: 'RGB Shift' })
      .on('change', ev => this.target.set('rgbShift', ev.value));
    effects.addBinding(this.params.effects, 'vignetteStrength', { min: 0, max: 2, step: 0.01, label: 'Vignette' })
      .on('change', ev => this.target.set('vignetteStrength', ev.value));

    const distortion = this.pane.addFolder({ title: 'DISTORTION', expanded: true });
    distortion.addBinding(this.params.distortion, 'curvature', { min: 0, max: 0.5, step: 0.005, label: 'Curvature' })
      .on('change', ev => this.target.set('curvature', ev.value));
    distortion.addBinding(this.params.distortion, 'flickerStrength', { min: 0, max: 0.15, step: 0.001, label: 'Flicker' })
      .on('change', ev => this.target.set('flickerStrength', ev.value));

    this.pane.addButton({ title: 'Reset to defaults' }).on('click', () => {
      this.resetToDefaults();
    });
  }

  resetToDefaults() {
    const d = this.defaults;
    this.target.setEnabled(d.enabled);
    this.target.set('scanlineIntensity', d.scanlineIntensity);
    this.target.set('scanlineCount', d.scanlineCount);
    this.target.set('adaptiveIntensity', d.adaptiveIntensity);
    this.target.set('brightness', d.brightness);
    this.target.set('contrast', d.contrast);
    this.target.set('saturation', d.saturation);
    this.target.set('bloomIntensity', d.bloomIntensity);
    this.target.set('bloomThreshold', d.bloomThreshold);
    this.target.set('rgbShift', d.rgbShift);
    this.target.set('vignetteStrength', d.vignetteStrength);
    this.target.set('curvature', d.curvature);
    this.target.set('flickerStrength', d.flickerStrength);

    this.params.enabled.crtEnabled = d.enabled;
    this.params.scanlines.scanlineIntensity = d.scanlineIntensity;
    this.params.scanlines.scanlineCount = d.scanlineCount;
    this.params.scanlines.adaptiveIntensity = d.adaptiveIntensity;
    this.params.color.brightness = d.brightness;
    this.params.color.contrast = d.contrast;
    this.params.color.saturation = d.saturation;
    this.params.effects.bloomIntensity = d.bloomIntensity;
    this.params.effects.bloomThreshold = d.bloomThreshold;
    this.params.effects.rgbShift = d.rgbShift;
    this.params.effects.vignetteStrength = d.vignetteStrength;
    this.params.distortion.curvature = d.curvature;
    this.params.distortion.flickerStrength = d.flickerStrength;
    this.pane.refresh();
  }
}
