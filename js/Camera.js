import {Ray, Vec3} from "./primitives.js"

export default class Camera{
    constructor(aspect_ratio, fov, position, lensRadius=0, focalDistance=0){
        this.aspect_ratio  = aspect_ratio
        this.fov           = fov
        this.position      = position
        this.lensRadius    = lensRadius
        this.focalDistance = focalDistance

        this.viewport_width  = 1
        this.viewport_height = 1/aspect_ratio
        this.focal_length    = (this.viewport_width/2) / Math.tan(fov*(Math.PI/180)/2)
        this.ray             = new Ray(Vec3.new(...position), Vec3.new(0,0,0))
    }

    static deserialize(c){
        return new Camera(c.aspect_ratio, c.fov, c.position, c.lensRadius, c.focalDistance)
    }

    getRay(u, v){
        this.ray.reset({
            x: this.viewport_width*(u-0.5),
            y: this.viewport_height*(0.5-v),
            z: -this.focal_length
        })

        if(this.lensRadius > 0 && this.focalDistance > 0){
            let lensU = Math.random()
            let lensV = Math.random()
            // TODO Not optimized but ok for now
            while(lensU*lensU + lensV*lensV > 1){
                lensU = Math.random()
                lensV = Math.random()
            }

            const focus_point = this.ray.at(-this.focalDistance/this.ray.direction.z)
            this.ray.origin.x += this.lensRadius * lensU
            this.ray.origin.y += this.lensRadius * lensV
            this.ray.direction.x = focus_point.x - this.ray.origin.x
            this.ray.direction.y = focus_point.y - this.ray.origin.y
            this.ray.direction.z = focus_point.z - this.ray.origin.z
        }

        return this.ray
    }
}