var container, fragmentShader;
var camera, scene, renderer, clock;
var uniforms;
const shaderText =
`
#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

#define MAX_STEPS 32
#define EPSILON .001
#define MAX_DIST 16.
#define PI 3.1415

float sphere(vec3 p, float s, vec3 c){
  return length(p - c) - s;
}

float sdCone( vec3 p, vec2 c, float h )
{
  float q = length(p.xz);
  return max(dot(c.xy,vec2(q,p.y)),-h-p.y);
}
vec4 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d){
      return vec4(a + b*cos(c*t + d), 1);
}
float smoothMod(float axis, float amp, float rad){
    float top = cos(PI * (axis / amp)) * sin(PI * (axis / amp));
    float bottom = pow(sin(PI * (axis / amp)), 2.0) + pow(rad, 2.0);
    float at = atan(top / bottom);
    return amp * (1.0 / 2.0) - (1.0 / PI) * at;
}    

vec2 modPolar(vec2 p, float repetitions){
  float angle = 2. * 3.14/repetitions;
  float a = atan(p.y, p.x) + angle/2.;
  float r = length(p);
  float c = floor(a/angle);
  a = mod(a, angle) - angle/2.;
  p = vec2(cos(a), sin(a))*r;
  return p;
}
// All components are in the range [0…1], including hue.
vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

float rand(float n){return fract(sin(n) * 43758.5453123);}


float map(float value, float min1, float max1, float min2, float max2) {
return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float scene1(in vec3 pos){
    float sphere = sphere(pos, 1.5, vec3(.5, .15, -.5));

    vec3 c = vec3(2.5, 1.5, 2. + 2.*abs(sin(u_time*.01)));
    pos = mod(pos, c) - c*.5;
    float map = map(sin(u_time*.01), -1., 1., .5, 3.5);
    float oct = sdCone(pos, vec2(map, .25), -.75);
    return oct + .3*sphere;
}


vec4 trace(vec3 rayOrigin, vec3 rayDir, float time){
  vec3 brightness = vec3(.6*abs(sin(u_time*.01)), .3, .2);
  vec3 contrast = vec3(.25, .1, .3);
  vec3 osc = vec3(0.8, 0.4, .6);
  vec3 phase = vec3(.3, .2, .4);
  vec4 bg;
  vec3 posOnRay = rayOrigin;
  float dist = 0.;
  float totalDist = 0.;
  for (int i = 0; i < MAX_STEPS; i++){
    dist = scene1(posOnRay);
    posOnRay += dist * rayDir;
    totalDist += dist;
    bg = cosPalette(totalDist, brightness, contrast, osc, phase);
    if (dist < EPSILON){
      vec4 col = vec4(.6*sin(u_time*.02), -.35, .5, 1.);
      return vec4(1. - (totalDist/MAX_DIST + col));
    }
    if (totalDist > MAX_DIST){
      return bg;
    }
  }
  return bg*.5;
}

vec3 lookAt(vec2 uv, vec3 camOrigin, vec3 camTarget){
  float fov = .5;
  vec3 zAxis = normalize(camTarget - camOrigin);
  vec3 up = vec3(0, 1, 0); 
  vec3 xAxis = normalize(cross(up, zAxis));
  vec3 yAxis = normalize(cross(zAxis, xAxis));
  vec3 dir = normalize(uv.x*xAxis + uv.y*yAxis + zAxis*fov);
  return dir;
} 


void main(void)
{
    float time = u_time/4.0;
    vec2 normCoord = gl_FragCoord.xy/u_resolution;
    normCoord.x *= u_resolution.x/u_resolution.y;
    vec2 uv = -1. + 2. * normCoord;
     uv.x -= u_resolution.y/u_resolution.x;
    vec3 camPos = vec3(0.5, 0.5, .5);
    vec3 rayOrigin = vec3(uv + camPos.xy, camPos.z +1.0);
    vec3 camTarget = vec3(abs(sin(.03*time)), abs(cos(.02*time)), 0.);
    vec3 rayDir = lookAt(uv, camPos, camTarget);
    vec4 color = trace(rayOrigin, rayDir, time);
    //gl_FragColor = vec4(.5*rgb2hsv(color.xyz), 1.0);
      gl_FragColor = vec4(color.xyz, 1.);
}           
`

window.onload = () =>{
    init();
    animate();
}



function init() {
    container = document.querySelector( '.shaderContainer' );
    document.querySelector('.fragmentShader').innerHTML = shaderText;
    camera = new THREE.Camera();
    camera.position.z = 1;

    scene = new THREE.Scene();
    clock = new THREE.Clock();
    var geometry = new THREE.PlaneBufferGeometry( 2, 2 );

    uniforms = {
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2(),},
        };

        var material = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: document.getElementById( 'vertexShader' ).textContent,
            fragmentShader: document.querySelector( '.fragmentShader' ).textContent
        } );

        var mesh = new THREE.Mesh( geometry, material );
        scene.add( mesh );
        renderer = new THREE.WebGLRenderer();
        renderer.setPixelRatio( window.devicePixelRatio );

        container.appendChild( renderer.domElement );

        onWindowResize();
        window.addEventListener( 'resize', onWindowResize, false );

        document.onmousemove = function(e){
            uniforms.u_mouse.value.x = e.pageX
            uniforms.u_mouse.value.y = e.pageY
          }
      }

      function onWindowResize( event ) {
          renderer.setSize( window.innerWidth, window.innerHeight );
          uniforms.u_resolution.value.x = renderer.domElement.width;
          uniforms.u_resolution.value.y = renderer.domElement.height;
      }

      function animate() {
          requestAnimationFrame( animate );
          render();
      }

      function render() {
          uniforms.u_time.value += clock.getDelta();
          renderer.render( scene, camera );
      }