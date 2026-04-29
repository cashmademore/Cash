import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, inject, effect } from '@angular/core';
import * as THREE from 'three';
import { VoiceService } from './voice.service';

@Component({
  selector: 'app-ai-avatar',
  standalone: true,
  template: `
    <div class="relative w-full h-full min-h-[300px] flex items-center justify-center bg-gray-950 overflow-hidden rounded-xl">
        <canvas #canvas class="w-full h-full object-cover"></canvas>
        @if (voiceService.isSpeaking()) {
            <div class="absolute bottom-4 inset-x-0 w-full text-center">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span class="w-2 h-2 mr-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                    Speaking
                </span>
            </div>
        }
    </div>
  `,
})
export class AiAvatarComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  voiceService = inject(VoiceService);
  
  private renderer!: THREE.WebGLRenderer;
  private camera!: THREE.PerspectiveCamera;
  private scene!: THREE.Scene;
  private mesh!: THREE.Mesh;
  private uniforms: any;
  private animationId: number = 0;
  private clock = new THREE.Clock();

  constructor() {
    effect(() => {
        // When speaking starts/stops, we could transition uniforms
        // We will just let the render loop read the signal if needed
    });
  }

  ngAfterViewInit() {
    if (typeof window !== 'undefined') {
        this.initThreeJs();
    }
  }

  private initThreeJs() {
    const canvas = this.canvasRef.nativeElement;
    const container = canvas.parentElement as HTMLElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.scene = new THREE.Scene();
    
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    this.camera.position.z = 4;

    // Creating an abstract "AI Core" using shader material
    const geometry = new THREE.IcosahedronGeometry(1, 64);
    
    this.uniforms = {
      uTime: { value: 0 },
      uSpeakingState: { value: 0 }
    };

    const material = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: `
        uniform float uTime;
        uniform float uSpeakingState;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        // Simplex noise function placeholder
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) { 
          const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
          const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy) );
          vec3 x0 = v - i + dot(i, C.xxx) ;
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min( g.xyz, l.zxy );
          vec3 i2 = max( g.xyz, l.zxy );
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i); 
          vec4 p = permute( permute( permute( 
                     i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
                   + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
                   + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));
          float n_ = 0.142857142857; // 1.0/7.0
          vec3  ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_ );
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4( x.xy, y.xy );
          vec4 b1 = vec4( x.zw, y.zw );
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;
          vec3 p0 = vec3(a0.xy,h.x);
          vec3 p1 = vec3(a0.zw,h.y);
          vec3 p2 = vec3(a1.xy,h.z);
          vec3 p3 = vec3(a1.zw,h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3) ) );
        }

        void main() {
          vUv = uv;
          vNormal = normal;
          
          float noise = snoise(position * 2.0 + uTime * 0.5);
          float displacement = noise * (0.05 + 0.15 * uSpeakingState);
          
          vec3 newPosition = position + normal * displacement;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uSpeakingState;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          vec3 baseColor = vec3(0.1, 0.5, 0.9); // Blue
          vec3 speakingColor = vec3(0.1, 0.9, 0.6); // Cyan/Green when speaking
          vec3 color = mix(baseColor, speakingColor, uSpeakingState);
          
          // Add some rim lighting
          float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
          color += vec3(0.2, 0.5, 0.8) * intensity;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `,
      wireframe: true,
      transparent: true
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.mesh);

    const animate = () => {
      this.animationId = requestAnimationFrame(animate);
      
      const elapsedTime = this.clock.getElapsedTime();
      this.uniforms.uTime.value = elapsedTime;
      
      // Interpolate speaking state
      const targetSpeaking = this.voiceService.isSpeaking() ? 1.0 : 0.0;
      this.uniforms.uSpeakingState.value += (targetSpeaking - this.uniforms.uSpeakingState.value) * 0.1;

      this.mesh.rotation.y += 0.005;
      this.mesh.rotation.x += 0.002;

      // Handle resize
      const currentWidth = container.clientWidth;
      const currentHeight = container.clientHeight;
      if (canvas.width !== currentWidth || canvas.height !== currentHeight) {
        this.renderer.setSize(currentWidth, currentHeight, false);
        this.camera.aspect = currentWidth / currentHeight;
        this.camera.updateProjectionMatrix();
      }

      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  ngOnDestroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
    if (this.renderer) {
      this.renderer.dispose();
    }
  }
}
