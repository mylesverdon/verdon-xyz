__How does this work?__

GPGPU techniques - i.e., using the GPU to calculate vertex positions and velocities.

The shader flow:

1. For every vertex (point), three things are associated:
    a. A vec3 position (initially random) stored in a 2d texture
    b. A vec3 velocity (initially random) stored in a 2d texture
    c. A corresponding UV position for texture lookup (the 'reference' attribute)

2. The GPUComputationRenderer is passed the two textures (1a, 1b) as variables

3. The Vertex and Fragment shaders are passed the two textures 

