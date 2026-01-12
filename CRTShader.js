// CRT Shader for Three.js
// Converted from LÖVE2D shader to standard GLSL

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
    #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
    #else
      precision mediump float;
    #endif

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

    // Precomputed constants
    const float PI = 3.14159265;
    const vec3 LUMA = vec3(0.299, 0.587, 0.114);
    const float BLOOM_THRESHOLD_FACTOR = 0.5;
    const float BLOOM_FACTOR_MULT = 1.5;
    const float RGB_SHIFT_SCALE = 0.005;
    const float RGB_SHIFT_INTENSITY = 0.08;

    // Optimized curvature function
    vec2 curveRemapUV(vec2 uv, float curvature) {
      vec2 coords = uv * 2.0 - 1.0;
      float curveAmount = curvature * 0.25; // Reduced from 0.5
      float dist = dot(coords, coords); // More efficient than x*x + y*y
      coords = coords * (1.0 + dist * curveAmount);
      return coords * 0.5 + 0.5;
    }

    // Optimized bloom sampling (single sample with larger radius)
    vec4 sampleBloom(sampler2D tex, vec2 uv, float radius) {
      // Single sample at larger offset for performance
      return texture2D(tex, uv) * 0.6 + texture2D(tex, uv + vec2(radius * 1.5)) * 0.4;
    }

    // Approximates vignette using Chebyshev distance squared instead of pow()
    float vignetteApprox(vec2 uv, float strength) {
      vec2 vigCoord = uv * 2.0 - 1.0;
      float dist = max(abs(vigCoord.x), abs(vigCoord.y));
      return 1.0 - dist * dist * strength; // Use squared distance instead of pow
    }

    void main() {
      vec2 uv = vUv;

      // Apply screen curvature if enabled (early out for out-of-bounds)
      if (curvature > 0.001) {
        uv = curveRemapUV(uv, curvature);
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.0);
          return;
        }
      }

      // Get the original pixel color
      vec4 pixel = texture2D(tDiffuse, uv);

      // Apply bloom effect with threshold-based sampling (skip if disabled)
      if (bloomIntensity > 0.001) {
        float pixelLum = dot(pixel.rgb, LUMA);
        // Only sample bloom if pixel is above threshold
        float bloomThresholdHalf = bloomThreshold * BLOOM_THRESHOLD_FACTOR;
        if (pixelLum > bloomThresholdHalf) {
          vec4 bloomSample = sampleBloom(tDiffuse, uv, 0.005);
          bloomSample.rgb *= brightness;
          float bloomLum = dot(bloomSample.rgb, LUMA);
          float bloomFactor = bloomIntensity * max(0.0, (bloomLum - bloomThreshold) * BLOOM_FACTOR_MULT);
          pixel.rgb += bloomSample.rgb * bloomFactor;
        }
      }

      // Apply RGB shift only if significant (skip for minimal values)
      if (rgbShift > 0.005) {
        float shift = rgbShift * RGB_SHIFT_SCALE;
        pixel.r += texture2D(tDiffuse, vec2(uv.x + shift, uv.y)).r * RGB_SHIFT_INTENSITY;
        pixel.b += texture2D(tDiffuse, vec2(uv.x - shift, uv.y)).b * RGB_SHIFT_INTENSITY;
      }

      // Apply brightness
      pixel.rgb *= brightness;

      // Apply contrast and saturation in one pass
      float luminance = dot(pixel.rgb, LUMA);
      pixel.rgb = (pixel.rgb - 0.5) * contrast + 0.5;
      pixel.rgb = mix(vec3(luminance), pixel.rgb, saturation);

      // Calculate combined lighting mask (scanlines, flicker, vignette)
      float lightingMask = 1.0;

      // Calculate scanlines (skip if disabled)
      if (scanlineIntensity > 0.001) {
        float scanlineY = (uv.y + yOffset) * scanlineCount;
        float scanlinePattern = abs(sin(scanlineY * PI));

        // Apply adaptive intensity if enabled
        float adaptiveFactor = 1.0;
        if (adaptiveIntensity > 0.001) {
          float yPattern = sin(uv.y * 30.0) * 0.5 + 0.5;
          adaptiveFactor = 1.0 - yPattern * adaptiveIntensity * 0.2;
        }

        lightingMask *= 1.0 - scanlinePattern * scanlineIntensity * adaptiveFactor;
      }

      // Apply flicker effect
      if (flickerStrength > 0.001) {
        lightingMask *= 1.0 + sin(time * 110.0) * flickerStrength;
      }

      // Apply vignette (skip if disabled)
      if (vignetteStrength > 0.001) {
        lightingMask *= vignetteApprox(uv, vignetteStrength);
      }

      // Apply combined lighting effects in single multiplication
      pixel.rgb *= lightingMask;

      gl_FragColor = pixel;
    }
  `
};
