import { Color, Ray, Vec3 } from "./primitives.js"

export const LIGHTS = {
    PointLight:0
}

export function deserialize(light){
    switch(light.type){
        case LIGHTS.PointLight:
            return new PointLight(light.position, light.color, light.power)
        default:
            console.error(`Unknown light type : ${light.type}`)
    }

}

export function sampleLight(lights){
    return lights[Math.floor(Math.random()*lights.length)]
}

export class PointLight{
    constructor(position, color, power){
        this.type = LIGHTS.PointLight
        this.position = position
        this.color = color
        this.power = power
    }

    getRadiance(ray){
        // Theoretically we are returning irradiance here, but outgoing radiance doesn't mean anything for point light
        const distance_squared = Vec3.norm_squared(Vec3.sub(Vec3.clone(this.position), ray.origin))
        return Color.mulScalar(Color.clone(this.color), this.power/(4*Math.PI*distance_squared))
    }

    getRay(origin){
        return Ray.new(Vec3.clone(origin), Vec3.sub(Vec3.clone(this.position), origin))
    }
}