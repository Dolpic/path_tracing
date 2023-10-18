import {Ray, Vec3} from "./primitives.js"

export default class Camera{
    constructor(aspect_ratio, fov, position){
        this.viewport_width  = 1
        this.viewport_height = 1/aspect_ratio
        this.focal_length    = (this.viewport_width/2) / Math.tan(fov*(Math.PI/180)/2)
        this.position        = position
    }

    static getRay(camera, u, v){
        let direction = new Vec3( 
            u*camera.viewport_width  - camera.viewport_width/2, 
            -(v*camera.viewport_height - camera.viewport_height/2), 
            -camera.focal_length
        )
        return new Ray( new Vec3(camera.position.x, camera.position.y, camera.position.z), direction )
    }
}