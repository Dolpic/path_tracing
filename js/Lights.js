import { Color, Ray, Vec3 } from "./primitives.js"

const LIGHTS = {
    PointLight:0
}

export function sampleLight(lights){
    return lights[Math.floor(Math.random()*lights.length)]
}

export class Light{
    constructor(color, power){
        this.color = color
        this.power = power
    }

    static deserialize(light){
        switch(light.type){
            case LIGHTS.PointLight:
                return new PointLight(light.position, light.color, light.power)
            default:
                console.error(`Unknown light type : ${light.type}`)
        }
    }
}

export class PointLight extends Light{
    constructor(position, color, power){
        super(color, power)
        this.type = LIGHTS.PointLight
        this.position = position
        this.ray = new Ray(Vec3.new(0,0,0), Vec3.new(0,0,0))
    }

    getRadiance(ray){
        // Theoretically we are returning irradiance here, but outgoing radiance doesn't mean anything for point light
        const distance_squared = Vec3.norm_squared(Vec3.sub(Vec3.clone(this.position), ray.origin))
        return Color.mulScalar(Color.clone(this.color), this.power/(4*Math.PI*distance_squared))
    }

    getRay(origin){
        return this.ray.setOrigin(origin).setDirection(Vec3.sub(Vec3.clone(this.position), origin))
    }
}