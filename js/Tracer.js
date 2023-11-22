import Timer from "./Timer.js"
import { Color } from "./primitives.js"
import { sampleLight, LIGHTS } from "./Lights.js"
import { Vec3 } from "./primitives.js"

class Tracer{
    constructor(objStructure, lights, maxDepth=100, lightSampling=true, timer=false){
        this.objStructure = objStructure
        this.lights    = lights.filter(l=>l.type!=LIGHTS.EnvironmentalLight)
        this.envLights = lights.filter(l=>l.type==LIGHTS.EnvironmentalLight)
        this.lightSampling = lightSampling
        this.maxDepth = maxDepth
        this.timer = timer ? new Timer() : false
    }

    trace(ray){
        for(let i=0; i<this.maxDepth; i++){
            //if(this.timer) this.timer.start()

            const {t, objHit} = this.objStructure.findIntersection(ray)
            if(t === Infinity){
                const envLight = sampleLight(this.envLights)
                if(envLight != undefined){
                   ray.addToThroughput(envLight.getRadiance(ray)) 
                }
                break
            }
            ray.moveOriginAt(t)
            //if(this.timer) this.timer.step("Intersection")
            this.interaction(ray, objHit)
            //if(this.timer) this.timer.step("Interaction")
        }
    }

    printTimerResult(){
        if(this.timer) this.timer.result()
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
        // TODO
    }
}

/*
    This tracer uses the importance sampling provided by the materials
*/
export class PathTracer extends Tracer{
    constructor(...params){
        super(...params)
    }

    interaction(ray, objHit){
        if(this.lightSampling){
            const normal = objHit.normalAt(ray.origin)
            const matSample = objHit.material.sample(ray, Vec3.clone(normal))

            Vec3.equal(ray.getDirection(), Vec3.normalize(matSample.direction))

            if(matSample.throughput !== Color.ZERO){
                const light = sampleLight(this.lights)
                if(light != undefined){
                    const {ray:lightRay, t:lightT} = light.getRay(ray.origin)
                    if(!this.objStructure.isOccluded(lightRay, lightT)){
                        const light_color = light.getRadiance(ray)
                        const hit_cos_angle = Math.abs(Vec3.dot(lightRay.getDirection(), matSample.normal))
                        const hit_color = Color.mulScalar(Color.mul(Color.clone(matSample.throughput), light_color), hit_cos_angle)
                        ray.addToThroughput(hit_color)
                    }else{
                       // ray.addToThroughput(Color.new(1,0,0))
                    }
                }
            }

            //const weightFactor = Color.mulScalar(Color.clone(matSample.weight), Vec3.dot(matSample.direction, matSample.normal))
            ray.updatePathWeight(matSample.weight)
        }else{
            // TODO
        }
    }
}