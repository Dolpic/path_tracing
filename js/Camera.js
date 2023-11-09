import {Ray, Vec3} from "./primitives.js"
import Matrix from "./primitives/Matrix.js"

export default class Camera{
    constructor(position, rotation, lens, fieldOfView=45, aspectRatio=1){
        this.aspectRatio  = aspectRatio
        this.fieldOfView  = fieldOfView
        this.position     = position
        this.rotation     = rotation
        this.lens         = lens

        this.transformMatrix = new Matrix().transform([position.x, position.y, position.z], [rotation.x, rotation.y, rotation.z])
        this.viewportWidth  = 1
        this.viewportHeight = 1/aspectRatio
        this.focalLength    = (this.viewportWidth/2) / Math.tan(fieldOfView*(Math.PI/180)/2)
        this.ray            = new Ray(Vec3.new(0,0,0), Vec3.new(0,0,0))
    }

    static deserialize(c){
        return new Camera(c.position, c.rotation, c.lens, c.fieldOfView, c.aspectRatio)
    }

    getRay(u, v){
        this.ray.reset(this.transformMatrix.applyToPoint({
            x: this.viewportWidth*(u-0.5),
            y: this.viewportHeight*(0.5-v),
            z: -this.focalLength
        }))

        if(this.lens.radius > 0 && this.lens.focalDistance > 0){
            let lensU = Math.random()
            let lensV = Math.random()
            // TODO Not optimized but ok for now
            while(lensU*lensU + lensV*lensV > 1){
                lensU = Math.random()
                lensV = Math.random()
            }

            const focus_point = this.ray.at(-this.lens.focalDistance/this.ray.getDirection().z)
            this.ray.origin.x += this.lens.radius * lensU
            this.ray.origin.y += this.lens.radius * lensV
            this.ray.setDirection(Vec3.new(
                focus_point.x - this.ray.origin.x,
                focus_point.y - this.ray.origin.y,
                focus_point.z - this.ray.origin.z
            ))
        }

        return this.ray
    }
}