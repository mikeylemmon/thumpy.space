precision mediump float;

varying vec4 vPosModel;

uniform vec4 uMaterialColor;
uniform sampler2D backbuffer;
uniform vec2 size;
uniform vec2 origin;
uniform float scale;
uniform float rotate;
uniform float mass; // mass of 0: no backbuffer; mass of 1: backbuffer only

void main(void) {
	vec2 uv = vec2(gl_FragCoord.x / size.x, 1.0 - gl_FragCoord.y / size.y);
	// scale and rotate the uv coords
	uv -= origin;
	uv *= scale + 1.0;
	float theta = atan(uv.y, uv.x) + rotate;
	float dist = sqrt(uv.y * uv.y + uv.x * uv.x);
	uv.x = dist * cos(theta);
	uv.y = dist * sin(theta);
	float sr = sin(rotate);
	uv.x = mix(uv.x, uv.x * size.y/size.x, sr);
	uv.y = mix(uv.y, uv.y * size.x/size.y, sr);
	uv += origin;
	vec4 bb = texture2D(backbuffer, uv);
	gl_FragColor = vec4(bb.xyz, mass);
}
