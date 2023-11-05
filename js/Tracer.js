import Timer from "./Timer.js"
import { Color } from "./primitives.js"
import { sampleLight } from "./Lights.js"
import { BxDF } from "./materials.js"
import { Vec3 } from "./primitives.js"

class Tracer{
    constructor(objStructure, maxDepth=100, lightSampling=true, timer=false){
        this.objStructure = objStructure
        this.lightSampling = lightSampling
        this.maxDepth = maxDepth
        this.timer = timer ? new Timer() : false
    }

    trace(ray){
        for(let i=0; i<this.maxDepth; i++){
            if(this.timer) this.timer.start()
            const {t, objHit} = this.objStructure.findIntersection(ray)
            if(t === Infinity){
                ray.addToThroughput(self.sky_color)
                break
            }
            ray.moveOriginAt(t)
            if(this.timer) this.timer.step()("Intersection")
            this.interaction(ray, objHit)
            if(this.timer) this.timer.step()("Interaction")
        }
    }
}

/*
    This tracer samples ray at random at each intersection
*/
export class RandomWalkTracer extends Tracer{
    constructor(...params){
        super(...params)
    }

    interaction(){

    }
}

/*

*/
export class PathTracer extends Tracer{
    constructor(lights, ...params){
        super(...params)
        this.lights = lights
    }

    interaction(ray, objHit){
        if(this.lightSampling){
            const light = sampleLight(this.lights)
            const lightRay = light.getRay(ray.origin)
            const material = self.materials[objHit.material]
            const material_color = Color.clone(material.apply(ray, objHit))
    
            if(material.type != BxDF.Dielectric){
                if(!this.objStructure.isOccluded(lightRay, 1)){
                    const light_color = light.getRadiance(ray)
                    const hit_cos_angle = Math.abs(Vec3.dot(Vec3.normalize(lightRay.direction), objHit.normalAt(ray.origin)))
                    const hit_color = Color.mulScalar(Color.mul(Color.clone(material_color), light_color), hit_cos_angle)
                    ray.addToThroughput(hit_color)
                }    
            }
            ray.updatePathWeight(material_color)
        }else{

        }
    }
}