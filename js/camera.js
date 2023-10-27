import {Ray, Vec3, Color} from "./primitives.js"

export default class Camera{
    constructor(aspect_ratio, fov, position, lensRadius=0, focalDistance=0){
        this.viewport_width  = 1
        this.viewport_height = 1/aspect_ratio
        this.focal_length    = (this.viewport_width/2) / Math.tan(fov*(Math.PI/180)/2)
        this.lensRadius      = lensRadius
        this.focalDistance   = focalDistance
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
        Color.equal(camera.ray.color, camera.start_color)

        if(camera.lensRadius > 0 && camera.focalDistance > 0){
            let lensU = Math.random()
            let lensV = Math.random()
            // TODO Not optimized but ok for now
            while(lensU*lensU + lensV*lensV > 1){
                lensU = Math.random()
                lensV = Math.random()
            }

            const focus_point = Ray.at(camera.ray, -camera.focalDistance/camera.ray.direction.z)
            camera.ray.origin.x += camera.lensRadius * lensU
            camera.ray.origin.y += camera.lensRadius * lensV
            camera.ray.direction.x = focus_point.x - camera.ray.origin.x
            camera.ray.direction.y = focus_point.y - camera.ray.origin.y
            camera.ray.direction.z = focus_point.z - camera.ray.origin.z
        }

        return camera.ray
    }
}