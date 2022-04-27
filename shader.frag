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
                bg = vec4(0., 0., 0., 1.);
                if (dist < EPSILON){
                  vec4 col = vec4(.6*sin(u_time*.02), -.35, .5, 1.);
                  return vec4(1. - (totalDist/MAX_DIST + col));
                }
                if (totalDist > MAX_DIST){
                  return bg;
                }
              }
              return bg;
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
                gl_FragColor = vec4(.5*color.xyz, 1.);
            }        