import { Color, Ray, Vec3 } from "./primitives.js"

export const LIGHTS = {
    PointLight:0
}

export function deserialize(light){
    switch(light.type){
        case LIGHTS.PointLight:
            return new PointLight(light.position, light.color)
        default:
            console.error(`Unknown light type : ${light.type}`)
    }

}

export function sampleLight(lights){
    return lights[Math.floor(Math.random()*lights.length)]
}

export class PointLight{
    constructor(position, color){
        this.type = LIGHTS.PointLight
        this.position = position
        this.color = color
    }

    apply(ray){
        return this.color
    }

    getRay(origin){
        return Ray.new(Vec3.clone(origin), Vec3.sub(Vec3.clone(this.position), origin))
    }
}