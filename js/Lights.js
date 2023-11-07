import { Color, Ray, Vec3 } from "./primitives.js"

export const LIGHTS = {
    PointLight:0
}

export function sampleLight(lights){
    return lights[Math.floor(Math.random()*lights.length)]
}

export default class Light{
    constructor(color, power){
        this.color = color
        this.power = power
    }

    static deserialize(l){
        switch(l.type){
            case LIGHTS.PointLight:
                return new PointLight(l.position, l.color, l.power)
            case LIGHTS.EnvironmentalLight:
                return new EnvironmentalLight(l.color, l.power)
            default:
                console.error(`Unknown light type : ${light.type}`)
        }
    }
}

export class PointLight extends Light{
    constructor(position, color, power=300){
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
        const dir = Vec3.sub(Vec3.clone(this.position), origin)
        const norm = Vec3.norm(dir)
        return {
            ray: this.ray.setOrigin(origin).setDirection(dir),
            t: norm
        }
    }
}

export class EnvironmentalLight extends Light{
    constructor(color, power=1){
        super(color, power)
    }

    getRadiance(){
        return Color.mulScalar(Color.clone(this.color), this.power)
    }

    getRay(){
        throw new Error("Undefined ray for environmental lights")
    }
}