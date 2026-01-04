// CRT Shader for Three.js
// Converted from my LÖVE2D shader to standard GLSL for Web
// 2025, by Matt Sephton @gingerbeardman

export const CRTShader = {
  uniforms: {
    tDiffuse: { value: null },
    scanlineIntensity: { value: 0.15 },
    scanlineCount: { value: 400.0 },
    time: { value: 0.0 },
    yOffset: { value: 0.0 },
    brightness: { value: 1.1 },
    contrast: { value: 1.05 },
    saturation: { value: 1.1 },
    bloomIntensity: { value: 0.2 },
    bloomThreshold: { value: 0.5 },
    rgbShift: { value: 0.0 },
    adaptiveIntensity: { value: 0.5 },
    vignetteStrength: { value: 0.3 },
    curvature: { value: 0.15 },
    flickerStrength: { value: 0.01 }
  },

  vertexShader: /* glsl */ `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,

  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float scanlineIntensity;
    uniform float scanlineCount;
    uniform float time;
    uniform float yOffset;
    uniform float brightness;
    uniform float contrast;
    uniform float saturation;
    uniform float bloomIntensity;
    uniform float bloomThreshold;
    uniform float rgbShift;
    uniform float adaptiveIntensity;
    uniform float vignetteStrength;
    uniform float curvature;
    uniform float flickerStrength;

    varying vec2 vUv;

    // Optimized curvature function
    vec2 curveRemapUV(vec2 uv, float curvature) {
      vec2 coords = uv * 2.0 - 1.0;
      float curveAmount = curvature * 0.25; // Reduced from 0.5
      float dist = dot(coords, coords); // More efficient than x*x + y*y
      coords = coords * (1.0 + dist * curveAmount);
      return coords * 0.5 + 0.5;
    }

    // Optimized bloom sampling (2x2 instead of 3x3)
    vec4 sampleBloom(sampler2D tex, vec2 uv, float radius) {
      vec4 bloom = texture2D(tex, uv) * 0.4;
      bloom += texture2D(tex, uv + vec2(radius, 0.0)) * 0.2;
      bloom += texture2D(tex, uv + vec2(-radius, 0.0)) * 0.2;
      bloom += texture2D(tex, uv + vec2(0.0, radius)) * 0.2;
      return bloom;
    }

    // Approximates vignette using Chebyshev distance squared instead of pow()
    float vignetteApprox(vec2 uv, float strength) {
      vec2 vigCoord = uv * 2.0 - 1.0;
      float dist = max(abs(vigCoord.x), abs(vigCoord.y));
      return 1.0 - dist * dist * strength; // Use squared distance instead of pow
    }

    void main() {
      vec2 uv = vUv;

      // Apply screen curvature if enabled
      if (curvature > 0.0) {
        uv = curveRemapUV(uv, curvature);
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.0);
          return;
        }
      }

      // Get the original pixel color
      vec4 pixel = texture2D(tDiffuse, uv);

      // Apply bloom effect with threshold-based sampling
      if (bloomIntensity > 0.0) {
        float pixelLum = dot(pixel.rgb, vec3(0.299, 0.587, 0.114));
        // Only sample bloom if pixel is above threshold
        if (pixelLum > bloomThreshold * 0.5) {
          vec4 bloomSample = sampleBloom(tDiffuse, uv, 0.005);
          bloomSample.rgb *= brightness;
          float bloomLum = dot(bloomSample.rgb, vec3(0.299, 0.587, 0.114));
          float bloomFactor = bloomIntensity * max(0.0, (bloomLum - bloomThreshold) * 1.5);
          pixel.rgb += bloomSample.rgb * bloomFactor;
        }
      }

      // Apply RGB shift only if needed
      if (rgbShift > 0.001) {
        float shift = rgbShift * 0.005; // Reduced offset
        pixel.r += texture2D(tDiffuse, vec2(uv.x + shift, uv.y)).r * 0.08;
        pixel.b += texture2D(tDiffuse, vec2(uv.x - shift, uv.y)).b * 0.08;
      }

      // Apply brightness
      pixel.rgb *= brightness;

      // Apply contrast
      pixel.rgb = (pixel.rgb - 0.5) * contrast + 0.5;

      // Apply saturation adjustment
      float luminance = dot(pixel.rgb, vec3(0.299, 0.587, 0.114));
      pixel.rgb = mix(vec3(luminance), pixel.rgb, saturation);

      // Calculate scanlines with caching
      float scanline = 1.0;
      if (scanlineIntensity > 0.0) {
        float scanlineY = (uv.y + yOffset) * scanlineCount;
        // Use built-in sin directly without pi constant
        float scanlinePattern = abs(sin(scanlineY * 3.14159265));
        float adaptiveFactor = 1.0;
        if (adaptiveIntensity > 0.001) {
          float yPattern = sin(uv.y * 30.0) * 0.5 + 0.5;
          adaptiveFactor = 1.0 - yPattern * adaptiveIntensity * 0.2;
        }
        scanline = 1.0 - scanlinePattern * scanlineIntensity * adaptiveFactor;
      }

      // Apply flicker effect
      float flicker = 1.0 + sin(time * 110.0) * flickerStrength;

      // Apply optimized vignette
      float vignette = 1.0;
      if (vignetteStrength > 0.0) {
        vignette = vignetteApprox(uv, vignetteStrength);
      }

      // Apply combined lighting effects
      pixel.rgb *= scanline * flicker * vignette;

      gl_FragColor = pixel;
    }
  `
};
