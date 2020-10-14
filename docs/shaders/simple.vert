attribute vec3 aPosition;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

varying vec4 vPosModel;

void main(void) {
	vPosModel = vec4(aPosition, 1.0);
	gl_Position = uProjectionMatrix * uModelViewMatrix * vPosModel;
}
