import {Ray, Vec3, Color} from "./primitives.js"

export default class Camera{
    constructor(aspect_ratio, fov, position){
        this.viewport_width  = 1
        this.viewport_height = 1/aspect_ratio
        this.focal_length    = (this.viewport_width/2) / Math.tan(fov*(Math.PI/180)/2)
        this.default_position        = position

        this.half_viewport_width  = this.viewport_width/2
        this.half_viewport_height = this.viewport_height/2
        this.minus_focal_length   = -this.focal_length

        this.start_color = Color.new(1,1,1,1)
        this.ray = Ray.new(Vec3.new(0,0,0), Vec3.new(0,0,0), Color.clone(this.start_color))
    }

    static getRay(camera, u, v){
        camera.ray.direction.x = u*camera.viewport_width    - camera.half_viewport_width
        camera.ray.direction.y = -v*camera.viewport_height  + camera.half_viewport_height
        camera.ray.direction.z = camera.minus_focal_length
        Vec3.equal(camera.ray.origin, camera.default_position)
        camera.ray.color = Color.clone(camera.start_color)
        return camera.ray
    }
}